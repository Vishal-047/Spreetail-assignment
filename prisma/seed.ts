import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // 1. Create Users
  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      name: 'Alice',
    },
  })

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      name: 'Bob',
    },
  })

  const charlie = await prisma.user.upsert({
    where: { email: 'charlie@example.com' },
    update: {},
    create: {
      email: 'charlie@example.com',
      name: 'Charlie',
    },
  })

  // 2. Create Group
  const group = await prisma.group.create({
    data: {
      name: 'Flatmates',
      members: {
        create: [
          { userId: alice.id },
          { userId: bob.id },
          { userId: charlie.id },
        ],
      },
    },
  })

  // 3. Create initial expense: Alice paid $90 for Dinner (split equally)
  const expense = await prisma.expense.create({
    data: {
      groupId: group.id,
      description: 'Dinner',
      amount: 90.0,
      date: new Date(),
      createdById: alice.id,
      payers: {
        create: [{ userId: alice.id, amountPaid: 90.0 }],
      },
      participants: {
        create: [
          { userId: alice.id, amountOwed: 30.0, splitType: 'EQUAL' },
          { userId: bob.id, amountOwed: 30.0, splitType: 'EQUAL' },
          { userId: charlie.id, amountOwed: 30.0, splitType: 'EQUAL' },
        ],
      },
    },
  })

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
