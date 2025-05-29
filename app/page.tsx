import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          SeedCamp 2025
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          {/* User Menu */}
        </div>
      </div>
      <div className="relative flex place-items-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-3xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-900 after:via-[#0141ff] after:blur-2xl after:content-[''] dark:before:bg-gradient-radial dark:before:from-white dark:before:to-transparent dark:after:from-[#0141ff] dark:after:via-[#0141ff] dark:after:opacity-40 before:lg:h-[360px]">
        {/* Documentation Link */}
        <Button variant="ghost" asChild className="hidden md:flex">
          <Link href="/docs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            เอกสารการใช้งานระบบ SeedCamp 2025
          </Link>
        </Button>

        {/* Mobile Documentation Link */}
        <Button variant="ghost" size="sm" asChild className="md:hidden">
          <Link href="/docs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            เอกสาร
          </Link>
        </Button>
      </div>
    </main>
  )
}
