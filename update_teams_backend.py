import re

file_path = 'client/backend/routes/teams.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Make sure generateSignedUrl is imported
if 'generateSignedUrl' not in content:
    import_stmt = "const { generateSignedUrl } = require('../utils/gcs');\n"
    # Find a good place to insert it
    const_idx = content.find("const express = require('express');")
    if const_idx != -1:
        content = content[:const_idx] + import_stmt + content[const_idx:]
    else:
        content = import_stmt + content

# We need to map over teams asynchronously to generate signed URLs for leader and members.
# In `teams.js`, `teams = teams.map(team => {` is synchronous. We can do an async map before or after.
# Since there's `teams = teams.map(team => {`, we can change it to `teams = await Promise.all(teams.map(async team => {`
# Let's use regex to replace it.

content = content.replace("teams = teams.map(team => {", "teams = await Promise.all(teams.map(async team => {")

# Add async signed URLs for leader and members
avatar_logic = """
      if (team.leader && team.leader.avatar) {
        team.leader.avatar = await generateSignedUrl(team.leader.avatar, 60 * 24 * 7);
      }
      
      if (team.members) {
        for (let m of team.members) {
          if (m.avatar) {
            m.avatar = await generateSignedUrl(m.avatar, 60 * 24 * 7);
          }
        }
      }
"""

# Insert the avatar logic right inside the map block
search_str = "const memberIds = [...team.members.map(m => m.id), team.leaderId];"
idx = content.find(search_str)
if idx != -1:
    content = content[:idx] + avatar_logic + content[idx:]

# Ensure the map closing block `});` is changed to `}));` because of Promise.all
# There are two `teams.map`? Only one that assigns to `teams` directly.
# Wait, replacing `});` -> `}));` is risky if there are multiple.
# Let's find the end of that specific `teams = await Promise.all(...)` block.
# Actually, the file has:
#       return {
#         ...team,
#         achievedTeamRevenue,
#         achievedTeamCount,
#         targetTeamRevenue,
#         targetTeamCount,
#         leader: {
#           ...team.leader,
#           target: leaderTarget ? {
#             targetCount: leaderIndividualTargetCount,
#             targetRevenue: leaderIndividualTargetRev
#           } : null
#         },
#         members: membersWithTargets
#       };
#     });
#
#     res.json(teams);

replace_end = """      };
    });

    res.json(teams);"""
with_end = """      };
    }));

    res.json(teams);"""

if replace_end in content:
    content = content.replace(replace_end, with_end)
else:
    print("Warning: could not find end of map block")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Backend update complete.")
