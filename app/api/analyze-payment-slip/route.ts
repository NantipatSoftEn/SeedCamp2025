import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export function GET(request: NextRequest) {
  return new Response('Hello, Next.js!', {
    status: 200,
  })
}


export async function POST(request: NextRequest) {
    const formData = await request.formData();
    // console.log("Received form data:", formData);
    const file = formData.get("file") as File
    const personId = formData.get("personId") as string
    return NextResponse.json({
        fileName: file.name,
        personId: personId,
        message: "File received successfully"
    })
}
