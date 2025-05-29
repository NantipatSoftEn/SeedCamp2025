import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <Button variant="outline" asChild>
        <Link href="/docs" className="flex items-center gap-2" title="เอกสารการใช้งาน - อ่านก่อนใช้ระบบ">
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">เอกสารการใช้งาน</span>
          <span className="sm:hidden">คู่มือ</span>
        </Link>
      </Button>
    </main>
  )
}
