import re

file_path = 'client/backend/routes/teams.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update the my-team endpoint
old_my_team_end = """    const targetTeamRevenue = leaderTarget ? (leaderTarget.targetRevenue || 0) : 0;
    const targetTeamCount = leaderTarget ? (leaderTarget.targetCount || 0) : 0;

    res.json({ hasTeam: true, isLeader: team.leaderId === employeeId, team: { ...team, achievedTeamRevenue, achievedTeamCount, targetTeamRevenue, targetTeamCount } });"""

new_my_team_end = """    const targetTeamRevenue = leaderTarget ? (leaderTarget.targetRevenue || 0) : 0;
    const targetTeamCount = leaderTarget ? (leaderTarget.targetCount || 0) : 0;
    
    // Calculate leader's individual target count by subtracting members' targets
    let leaderIndividualTargetCount = targetTeamCount;
    if (leaderTarget && team.members && team.members.length > 0) {
      const sumMembersTargets = team.members.reduce((sum, member) => {
        return sum + (member.target ? (member.target.targetCount || 0) : 0);
      }, 0);
      leaderIndividualTargetCount = Math.max(0, targetTeamCount - sumMembersTargets);
    }
    
    const calculatedLeaderTarget = leaderTarget ? {
      ...leaderTarget,
      targetCount: leaderIndividualTargetCount
    } : null;

    res.json({ hasTeam: true, isLeader: team.leaderId === employeeId, team: { ...team, achievedTeamRevenue, achievedTeamCount, targetTeamRevenue, targetTeamCount, leaderIndividualTarget: calculatedLeaderTarget } });"""

content = content.replace(old_my_team_end, new_my_team_end)

# 2. Add update-member-target endpoint
new_endpoint = """
// UPDATE team member target
router.put('/update-member-target/:memberId', authenticate, async (req, res) => {
  const { targetCount, month } = req.body;
  const memberId = req.params.memberId;
  const leaderId = req.user.id;

  try {
    // Verify the caller is the leader of the team this member belongs to
    const member = await prisma.employee.findUnique({
      where: { id: memberId },
      include: { team: true }
    });

    if (!member || !member.team || member.team.leaderId !== leaderId) {
      return res.status(403).json({ error: 'You are not authorized to edit this member\\'s target.' });
    }

    const currentMonth = month || new Date().toISOString().substring(0, 7);

    // Find if target exists
    const existingTarget = await prisma.target.findFirst({
      where: {
        employeeId: memberId,
        month: currentMonth
      }
    });

    let target;
    if (existingTarget) {
      target = await prisma.target.update({
        where: { id: existingTarget.id },
        data: { targetCount: parseInt(targetCount, 10) }
      });
    } else {
      target = await prisma.target.create({
        data: {
          employeeId: memberId,
          month: currentMonth,
          targetCount: parseInt(targetCount, 10),
          targetRevenue: 0,
          achievedCount: 0,
          achievedRevenue: 0
        }
      });
    }

    res.json({ success: true, target });
  } catch (error) {
    console.error('Error updating member target:', error);
    res.status(500).json({ error: error.message });
  }
});
"""

if "update-member-target" not in content:
    # Add right before "// CREATE a new team"
    content = content.replace("// CREATE a new team", new_endpoint + "\n// CREATE a new team")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Backend routes updated successfully.")
