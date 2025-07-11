import { prisma } from "@audiobook/db/client";

export interface CreateUserData {
    googleId: string;
    email: string;
    name: string;
    avatar?: string
}

export const userService = {
    findByGoogleId: async (googleId: string) => {
        return await prisma.user.findUnique({
            where: { googleId }
        })
    },

    createUser: async (userData: CreateUserData) => {
        return await prisma.user.create({
            data: {
                googleId: userData.googleId,
                email: userData.email,
                name: userData.name,
                avatar: userData.avatar,
                createdAt: new Date(),
                lastLogin: new Date()
            }
        })
    },

    updateLastLogin: async (userId: string) => {
        return await prisma.user.update({
            where: { id: userId },
            data: { lastLogin: new Date() }
        })
    },

    findById: async (id: string) => {
        return await prisma.user.findUnique({
            where: { id }
        });
    },

    getAllUsers: async () => {
        return await prisma.user.findMany({
            orderBy: { createdAt: 'desc' }
        });
    }
}