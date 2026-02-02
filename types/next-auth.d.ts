import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: {
            id: string
            plan: string
            restaurantName: string
            role: string
        } & DefaultSession["user"]
    }

    interface User {
        id: string
        plan: string
        restaurantName: string
        role: string
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        plan: string
        restaurantName: string
        role: string
    }
}
