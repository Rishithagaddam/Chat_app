// Debug script to check group membership
// Run this in your MongoDB shell or add it to a route temporarily

const mongoose = require('mongoose');
const Group = require('./server/models/Group');
const User = require('./server/models/User');

async function debugGroupMembership() {
    try {
        const groupId = '68d4d88f2c6e4c5747628108';
        
        // Find the group
        const group = await Group.findById(groupId)
            .populate('admin', 'name email')
            .populate('members.user', 'name email');
        
        if (!group) {
            console.log('❌ Group not found');
            return;
        }
        
        console.log('✅ Group found:', {
            id: group._id.toString(),
            name: group.name,
            admin: group.admin,
            isActive: group.isActive,
            memberCount: group.members.length
        });
        
        console.log('👥 Group members:');
        group.members.forEach((member, index) => {
            console.log(`  ${index + 1}. ${member.user.name} (${member.user.email}) - Role: ${member.role}`);
        });
        
        // Get current user (replace with actual user ID from localStorage token)
        const users = await User.find({}).select('name email');
        console.log('\n👤 Available users:');
        users.forEach((user, index) => {
            console.log(`  ${index + 1}. ${user.name} (${user.email}) - ID: ${user._id}`);
        });
        
    } catch (error) {
        console.error('Error:', error);
    }
}

// Call this function to debug
// debugGroupMembership();