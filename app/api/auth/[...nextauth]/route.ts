import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handler = NextAuth(authOptions);

// NextAuth needs both GET and POST in Route Handlers
export { handler as GET, handler as POST };
