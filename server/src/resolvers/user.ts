import { Resolver, Mutation, Arg, Ctx } from "type-graphql";
import { User, AuthResponse } from "../types/User.js";
import { RegisterInput, LoginInput } from "../inputs/AuthInput.js";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

interface Context {
  prisma: PrismaClient;
}

// In a real app, this should be inside your .env file
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_algojudge_key";

@Resolver(() => User)
export class UserResolver {
  
  @Mutation(() => AuthResponse)
  async register(
    @Arg("input") input: RegisterInput,
    @Ctx() { prisma }: Context
  ): Promise<AuthResponse> {
    
    // 1. Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: input.email }, { username: input.username }],
      },
    });

    if (existingUser) {
      throw new Error("User with that email or username already exists");
    }

    // 2. Hash the password
    const hashedPassword = await bcrypt.hash(input.password, 12);

    // 3. Create the user in the database
    const user = await prisma.user.create({
      data: {
        username: input.username,
        email: input.email,
        password: hashedPassword,
      },
    });

    // 4. Generate the JWT Token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "7d", // Token valid for 7 days
    });

    return { user, token };
  }

  @Mutation(() => AuthResponse)
  async login(
    @Arg("input") input: LoginInput,
    @Ctx() { prisma }: Context
  ): Promise<AuthResponse> {
    
    // 1. Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new Error("Invalid email or password");
    }

    // 2. Verify the password against the stored hash
    const isValidPassword = await bcrypt.compare(input.password, user.password);

    if (!isValidPassword) {
      throw new Error("Invalid email or password");
    }

    // 3. Generate a new JWT token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return { user, token };
  }
}