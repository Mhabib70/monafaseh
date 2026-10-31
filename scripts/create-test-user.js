// Create test user with known password
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('testpass', 10);
  // Try create, fallback to update if exists
  let user;
  try {
    user = await prisma.user.create({
      data: {
        email: 'testuser@example.com',
        fullName: 'Test User',
        passwordHash,
        role: 'user',
        gender: 'male',
        avatarColor: '#FFD700',
      },
    });
    console.log('Created new user:', user.id);
  } catch (e) {
    if (e.code === 'P2002') {
      // Already exists — update password
      user = await prisma.user.update({
        where: { email: 'testuser@example.com' },
        data: { passwordHash },
      });
      console.log('Updated existing user:', user.id);
    } else {
      throw e;
    }
  }

  console.log('User details:', JSON.stringify({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
  }, null, 2));

  // Now create a session as this user
  const session = await prisma.recitationSession.create({
    data: {
      title: 'TEST END SESSION',
      hostId: user.id,
      recitationType: 'ترتیل',
      reciterNationality: 'iranian',
      favoriteReciter: 'test',
      surah: '—',
      capacity: 10,
      status: 'open',
      genderRestriction: 'male',
      passwordProtected: false,
      jitsiRoom: 'test-room',
    },
  });
  console.log('Created session:', session.id, '| hostId:', session.hostId);

  await prisma.$disconnect();
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
