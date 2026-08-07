import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "pg";

const { Pool } = pkg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding 20 problems and test cases...");

  // Clear existing records in the correct order (children first, then parents)
  await prisma.submission.deleteMany({});
  await prisma.testCase.deleteMany({});
  await prisma.problem.deleteMany({});

  const problemsData = [
    {
      title: "Two Sum",
      difficulty: "Easy",
      description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
      timeLimit: 1000,
      memoryLimit: 256,
      testCases: [
        { input: "[2,7,11,15], 9", expectedOutput: "[0,1]" },
        { input: "[3,2,4], 6", expectedOutput: "[1,2]" }
      ],
    },
    {
      title: "Valid Parentheses",
      difficulty: "Easy",
      description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
      timeLimit: 1000,
      memoryLimit: 256,
      testCases: [
        { input: "()[]{}", expectedOutput: "true" },
        { input: "(]", expectedOutput: "false" }
      ],
    },
    {
      title: "Reverse Linked List",
      difficulty: "Easy",
      description: "Given the head of a singly linked list, reverse the list, and return the reversed list.",
      timeLimit: 1000,
      memoryLimit: 256,
      testCases: [
        { input: "[1,2,3,4,5]", expectedOutput: "[5,4,3,2,1]" },
        { input: "[1,2]", expectedOutput: "[2,1]" }
      ],
    },
    {
      title: "Maximum Subarray",
      difficulty: "Medium",
      description: "Given an integer array nums, find the contiguous subarray which has the largest sum and return its sum.",
      timeLimit: 1000,
      memoryLimit: 256,
      testCases: [
        { input: "[-2,1,-3,4,-1,2,1,-5,4]", expectedOutput: "6" },
        { input: "[1]", expectedOutput: "1" }
      ],
    },
    {
      title: "Merge Intervals",
      difficulty: "Medium",
      description: "Given an array of intervals, merge all overlapping intervals, and return an array of the non-overlapping intervals.",
      timeLimit: 1000,
      memoryLimit: 256,
      testCases: [
        { input: "[[1,3],[2,6],[8,10],[15,18]]", expectedOutput: "[[1,6],[8,10],[15,18]]" },
        { input: "[[1,4],[4,5]]", expectedOutput: "[[1,5]]" }
      ],
    },
    {
      title: "Contains Duplicate",
      difficulty: "Easy",
      description: "Given an integer array nums, return true if any value appears at least twice in the array, and false if every element is distinct.",
      timeLimit: 1000,
      memoryLimit: 256,
      testCases: [
        { input: "[1,2,3,1]", expectedOutput: "true" },
        { input: "[1,2,3,4]", expectedOutput: "false" }
      ],
    },
    {
      title: "Valid Anagram",
      difficulty: "Easy",
      description: "Given two strings s and t, return true if t is an anagram of s, and false otherwise.",
      timeLimit: 1000,
      memoryLimit: 256,
      testCases: [
        { input: "anagram, nagaram", expectedOutput: "true" },
        { input: "rat, car", expectedOutput: "false" }
      ],
    },
    {
      title: "Binary Search",
      difficulty: "Easy",
      description: "Given a sorted array of integers nums and a target, write a function to search target. Return its index or -1.",
      timeLimit: 1000,
      memoryLimit: 256,
      testCases: [
        { input: "[-1,0,3,5,9,12], 9", expectedOutput: "4" },
        { input: "[-1,0,3,5,9,12], 2", expectedOutput: "-1" }
      ],
    },
    {
      title: "Best Time to Buy and Sell Stock",
      difficulty: "Easy",
      description: "You are given an array prices where prices[i] is the price of a given stock on the ith day. Maximize your profit.",
      timeLimit: 1000,
      memoryLimit: 256,
      testCases: [
        { input: "[7,1,5,3,6,4]", expectedOutput: "5" },
        { input: "[7,6,4,3,1]", expectedOutput: "0" }
      ],
    },
    {
      title: "Climbing Stairs",
      difficulty: "Easy",
      description: "You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. How many distinct ways can you climb to the top?",
      timeLimit: 1000,
      memoryLimit: 256,
      testCases: [
        { input: "2", expectedOutput: "2" },
        { input: "3", expectedOutput: "3" }
      ],
    },
    {
      title: "Palindrome Number",
      difficulty: "Easy",
      description: "Given an integer x, return true if x is a palindrome, and false otherwise.",
      timeLimit: 1000,
      memoryLimit: 256,
      testCases: [
        { input: "121", expectedOutput: "true" },
        { input: "-121", expectedOutput: "false" }
      ],
    },
    {
      title: "Longest Substring Without Repeating Characters",
      difficulty: "Medium",
      description: "Given a string s, find the length of the longest substring without repeating characters.",
      timeLimit: 1000,
      memoryLimit: 256,
      testCases: [
        { input: "abcabcbb", expectedOutput: "3" },
        { input: "bbbbb", expectedOutput: "1" }
      ],
    },
    {
      title: "3Sum",
      difficulty: "Medium",
      description: "Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that they add up to zero.",
      timeLimit: 1000,
      memoryLimit: 256,
      testCases: [
        { input: "[-1,0,1,2,-1,-4]", expectedOutput: "[[-1,-1,2],[-1,0,1]]" },
        { input: "[0,1,1]", expectedOutput: "[]" }
      ],
    },
    {
      title: "Product of Array Except Self",
      difficulty: "Medium",
      description: "Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].",
      timeLimit: 1000,
      memoryLimit: 256,
      testCases: [
        { input: "[1,2,3,4]", expectedOutput: "[24,12,8,6]" },
        { input: "[-1,1,0,-3,3]", expectedOutput: "[0,0,9,0,0]" }
      ],
    },
    {
      title: "Group Anagrams",
      difficulty: "Medium",
      description: "Given an array of strings strs, group the anagrams together.",
      timeLimit: 1000,
      memoryLimit: 256,
      testCases: [
        { input: "[\"eat\",\"tea\",\"tan\",\"ate\",\"nat\",\"bat\"]", expectedOutput: "[[\"bat\"],[\"nat\",\"tan\"],[\"ate\",\"eat\",\"tea\"]]" },
        { input: "[\"\"]", expectedOutput: "[[\"\"]]" }
      ],
    },
    {
      title: "Maximum Product Subarray",
      difficulty: "Medium",
      description: "Given an integer array nums, find a contiguous non-empty subarray within the array that has the largest product.",
      timeLimit: 1000,
      memoryLimit: 256,
      testCases: [
        { input: "[2,3,-2,4]", expectedOutput: "6" },
        { input: "[-2,0,-1]", expectedOutput: "0" }
      ],
    },
    {
      title: "Search in Rotated Sorted Array",
      difficulty: "Medium",
      description: "Given the array nums after the possible rotation and an integer target, return the index of target if it is in nums, or -1 if it is not.",
      timeLimit: 1000,
      memoryLimit: 256,
      testCases: [
        { input: "[4,5,6,7,0,1,2], 0", expectedOutput: "4" },
        { input: "[4,5,6,7,0,1,2], 3", expectedOutput: "-1" }
      ],
    },
    {
      title: "Coin Change",
      difficulty: "Medium",
      description: "You are given an integer array coins representing coins of different denominations and an integer amount. Return the fewest number of coins that you need to make up that amount.",
      timeLimit: 1000,
      memoryLimit: 256,
      testCases: [
        { input: "[1,2,5], 11", expectedOutput: "3" },
        { input: "[2], 3", expectedOutput: "-1" }
      ],
    },
    {
      title: "House Robber",
      difficulty: "Medium",
      description: "You are a professional robber planning to rob houses along a street. Determine the maximum amount of money you can rob tonight without alerting the police.",
      timeLimit: 1000,
      memoryLimit: 256,
      testCases: [
        { input: "[1,2,3,1]", expectedOutput: "4" },
        { input: "[2,7,9,3,1]", expectedOutput: "12" }
      ],
    },
    {
      title: "Number of Islands",
      difficulty: "Medium",
      description: "Given an m x n 2D binary grid grid which represents a map of '1's (land) and '0's (water), return the number of islands.",
      timeLimit: 1000,
      memoryLimit: 256,
      testCases: [
        { input: "[[\"1\",\"1\",\"1\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"0\",\"0\",\"0\",\"0\",\"0\"]]", expectedOutput: "1" },
        { input: "[[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"0\",\"0\",\"1\",\"0\",\"0\"],[\"0\",\"0\",\"0\",\"1\",\"1\"]]", expectedOutput: "3" }
      ],
    }
  ];

  for (const prob of problemsData) {
    const { testCases, ...problemData } = prob;
    await prisma.problem.create({
      data: {
        ...problemData,
        testCases: {
          create: testCases,
        },
      },
    });
  }

  console.log("Successfully seeded 20 problems with test cases!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });