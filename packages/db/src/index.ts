import { PrismaClient } from "@prisma/client";

export const prismaClient = new PrismaClient();

export async function checkRoomExists(roomId: number) {
  return prismaClient.room.findUnique({
    where: { id: roomId },
  });
}

export async function createUser(
  email: string,
  name: string,
  password: string,
) {
  const user = await prismaClient.user.create({
    data: {
      email,
      password,
      name,
    },
  });

  return user;
}

export async function checkExistingUser(email: string) {
  return prismaClient.user.findUnique({
    where: { email },
  });
}

export async function createRoom(userId: string, name: string) {
  try {
    const room = await prismaClient.room.create({
      data: {
        name,
      },
    });

    await prismaClient.userRoom.create({
      data: {
        userId,
        roomId: room.id,
      },
    });

    return room;
  } catch (e) {
    console.log(e);
    return null;
  }
}

export function saveMessage(roomId: number, userId: string, content: string) {
  return prismaClient.message.create({
    data: {
      roomId,
      userId,
      content,
    },
    include: {
      user: { select: { id: true, name: true } },
    },
  });
}

export async function getRoom(roomId: number) {
  const room = await prismaClient.room.findUnique({
    where: { id: roomId },
  });

  return room;
}
