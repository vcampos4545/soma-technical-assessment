import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const todos = await prisma.todo.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(todos);
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching todos" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { title, dueDate } = await request.json();
    if (!title || title.trim() === "") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!dueDate || dueDate.trim() === "") {
      return NextResponse.json(
        { error: "Due date is required" },
        { status: 400 }
      );
    }

    // Convert string date to Date object and set to end of day
    const dueDateObj = new Date(dueDate);
    dueDateObj.setHours(23, 59, 59, 999); // Set to end of day (11:59:59.999 PM)

    // Fetch image from Pexels API
    const pexelsApiKey = process.env.PEXELS_API_KEY;
    let imageUrl = null;

    if (pexelsApiKey) {
      try {
        const pexelsResponse = await fetch(
          `https://api.pexels.com/v1/search?query=${encodeURIComponent(
            title
          )}&per_page=1`,
          {
            headers: {
              Authorization: `${pexelsApiKey}`,
            },
          }
        );

        console.log(pexelsResponse);

        if (pexelsResponse.ok) {
          const pexelsData = await pexelsResponse.json();
          if (pexelsData.photos && pexelsData.photos.length > 0) {
            imageUrl = pexelsData.photos[0].src.large;
          }
        }
      } catch (imageError) {
        console.error("Error fetching image:", imageError);
        // Continue without image if there's an error
      }
    }

    const todo = await prisma.todo.create({
      data: {
        title,
        dueDate: dueDateObj,
        imageUrl,
      },
    });
    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    console.error("Error creating todo:", error);
    return NextResponse.json({ error: "Error creating todo" }, { status: 500 });
  }
}
