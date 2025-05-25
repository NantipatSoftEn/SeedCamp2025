import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Read the file
    const text = await file.text()
    const rows = text.split("\n")
    const headers = rows[0].split(",").map((h) => h.trim())

    // Parse CSV data
    const people = []
    for (let i = 1; i < rows.length; i++) {
      if (!rows[i].trim()) continue

      const values = rows[i].split(",").map((v) => v.trim())
      const person: any = {}

      headers.forEach((header, index) => {
        if (values[index] !== undefined) {
          // Map CSV headers to database columns
          switch (header) {
            case "nick_name":
              person.nick_name = values[index]
              break
            case "first_name":
              person.first_name = values[index]
              break
            case "last_name":
              person.last_name = values[index]
              break
            case "gender":
              person.gender = values[index].toLowerCase()
              break
            case "group_care":
              person.group_care = values[index] || "ungroup"
              break
            case "phone":
              person.phone = values[index]
              break
            case "congenital_disease":
              person.congenital_disease = values[index]
              break
            case "shirt_size":
              person.shirt_size = values[index].toUpperCase()
              break
            case "payment_status":
              person.payment_status = values[index] ? values[index].toLowerCase() : "unpaid"
              break
            case "can_go":
              person.can_go = values[index]?.toLowerCase() === "true"
              break
            case "remark":
              person.remark = values[index]
              break
            default:
              // Handle any other columns
              person[header] = values[index]
          }
        }
      })

      // Set default values for required fields
      if (!person.payment_amount) person.payment_amount = 1500
      if (person.payment_status === undefined) person.payment_status = "unpaid"

      people.push(person)
    }

    // Insert data in batches
    const supabase = getSupabaseServerClient()
    const batchSize = 50
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < people.length; i += batchSize) {
      const batch = people.slice(i, i + batchSize)

      const { data, error } = await supabase.from("seedcamp_people").insert(batch)

      if (error) {
        console.error("Error inserting batch:", error)
        errorCount += batch.length
      } else {
        successCount += batch.length
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import completed. ${successCount} records imported successfully, ${errorCount} errors.`,
      stats: {
        total: people.length,
        success: successCount,
        error: errorCount,
      },
    })
  } catch (error) {
    console.error("Import error:", error)
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
