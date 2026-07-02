import re

file_path = 'client/backend/routes/teams.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# We want to replace the GET / all teams route
start_marker = "router.get('/', authenticate, async (req, res) => {"
end_marker = "    res.json(teams);\n  } catch (error) {\n    res.status(500).json({ error: error.message });\n  }\n});"

new_route = """router.get('/', authenticate, async (req, res) => {
  try {
    let teams = await prisma.team.findMany({
      include: {
        leader: { select: { id: true, name: true, email: true, avatar: true } },
        members: { select: { id: true, name: true, email: true, role: true, department: true, avatar: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const month = new Date().toISOString().substring(0, 7);
    const allMemberIds = teams.flatMap(t => [...t.members.map(m => m.id), t.leaderId]);
    const allTargets = await prisma.target.findMany({
      where: {
        employeeId: { in: allMemberIds },
        month: month
      }
    });

    teams = teams.map(team => {
      const memberIds = [...team.members.map(m => m.id), team.leaderId];
      const teamTargets = allTargets.filter(t => memberIds.includes(t.employeeId));
      
      const achievedTeamRevenue = teamTargets.reduce((sum, target) => sum + (target.achievedRevenue || 0), 0);
      const achievedTeamCount = teamTargets.reduce((sum, target) => sum + (target.achievedCount || 0), 0);
      
      // Calculate individual targets for members
      const membersWithTargets = team.members.map(member => {
        const target = teamTargets.find(t => t.employeeId === member.id) || null;
        return {
          ...member,
          target
        };
      });

      // Calculate leader targets
      const leaderTarget = teamTargets.find(t => t.employeeId === team.leaderId);
      const targetTeamRevenue = leaderTarget ? (leaderTarget.targetRevenue || 0) : 0;
      const targetTeamCount = leaderTarget ? (leaderTarget.targetCount || 0) : 0;

      // The leader's individual target is the total target minus all assigned targets to members
      const assignedTargetsToMembersCount = membersWithTargets.reduce((sum, m) => sum + (m.target?.targetCount || 0), 0);
      const assignedTargetsToMembersRev = membersWithTargets.reduce((sum, m) => sum + (m.target?.targetRevenue || 0), 0);
      
      const leaderIndividualTarget = {
        targetCount: Math.max(0, targetTeamCount - assignedTargetsToMembersCount),
        achievedCount: leaderTarget ? (leaderTarget.achievedCount || 0) : 0,
        targetRevenue: Math.max(0, targetTeamRevenue - assignedTargetsToMembersRev),
        achievedRevenue: leaderTarget ? (leaderTarget.achievedRevenue || 0) : 0
      };

      return {
        ...team,
        members: membersWithTargets,
        achievedTeamRevenue,
        achievedTeamCount,
        targetTeamRevenue,
        targetTeamCount,
        leaderIndividualTarget
      };
    });

    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});"""

start_idx = content.find(start_marker)
end_idx = content.find(end_marker) + len(end_marker)

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + new_route + content[end_idx:]
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("GET /api/teams route updated successfully.")
else:
    print("Could not find the target code block.")
