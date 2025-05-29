import { ArrowLeft, Users, BarChart3, Upload, FileText, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto p-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                กลับสู่ระบบ
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">เอกสารการใช้งานระบบ SeedCamp 2025</h1>
              <p className="text-gray-600">คู่มือการใช้งานระบบจัดการข้อมูลผู้เข้าร่วม</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto p-4 max-w-4xl">
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>สำคัญ:</strong> กรุณาอ่านเอกสารนี้ให้ครบถ้วนก่อนเริ่มใช้งานระบบ เพื่อความถูกต้องและปลอดภัยของข้อมูล
          </AlertDescription>
        </Alert>

        <div className="grid gap-6">
          {/* ภาพรวมระบบ */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                ภาพรวมระบบ
              </CardTitle>
              <CardDescription>ระบบจัดการข้อมูลผู้เข้าร่วม SeedCamp 2025</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>ระบบนี้ใช้สำหรับจัดการข้อมูลผู้เข้าร่วมงาน SeedCamp 2025 ประกอบด้วยฟีเจอร์หลัก:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>จัดการข้อมูลผู้เข้าร่วม (เพิ่ม แก้ไข ลบ)</li>
                <li>ติดตามสถานะการชำระเงิน</li>
                <li>อัปโหลดสลิปการชำระเงิน</li>
                <li>ดูสถิติและรายงาน</li>
                <li>นำเข้าข้อมูลจากไฟล์ CSV</li>
              </ul>
            </CardContent>
          </Card>

          {/* การใช้งาน People Dashboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                People Dashboard - จัดการข้อมูลผู้เข้าร่วม
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="font-semibold">การดูข้อมูล:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>ดูรายชื่อผู้เข้าร่วมทั้งหมดในตาราง</li>
                <li>ใช้ช่องค้นหาเพื่อหาผู้เข้าร่วมเฉพาะ</li>
                <li>กรองข้อมูลตามสถานะการชำระเงิน</li>
                <li>เรียงลำดับข้อมูลตามคอลัมน์ต่างๆ</li>
              </ul>

              <h4 className="font-semibold">การแก้ไขข้อมูล:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>คลิกปุ่ม "แก้ไข" ในแถวที่ต้องการ</li>
                <li>กรอกข้อมูลในฟอร์มให้ครบถ้วน</li>
                <li>อัปโหลดสลิปการชำระเงิน (ถ้ามี)</li>
                <li>คลิก "บันทึก" เพื่อยืนยันการเปลี่ยนแปลง</li>
              </ul>

              <h4 className="font-semibold">ข้อมูลที่สำคัญ:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>
                  <strong>ชื่อเล่น:</strong> ใช้สำหรับเรียกในงาน
                </li>
                <li>
                  <strong>เบอร์โทร:</strong> สำหรับติดต่อฉุกเฉิน
                </li>
                <li>
                  <strong>ไซส์เสื้อ:</strong> สำหรับจัดเตรียมเสื้อ
                </li>
                <li>
                  <strong>สถานะการชำระเงิน:</strong> Paid/Pending/Unpaid
                </li>
                <li>
                  <strong>จำนวนเงิน:</strong> ยอดที่ต้องชำระ (สามารถเป็น 0 ได้)
                </li>
                <li>
                  <strong>remark (หมายเหตุ):</strong>  เช่นไปไม่ได้เพราะ... โรคประจำตัว etc.
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* การใช้งาน Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics Dashboard - ดูสถิติและรายงาน
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="font-semibold">สถิติที่แสดง:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>จำนวนผู้เข้าร่วมทั้งหมด</li>
                <li>สถิติการชำระเงิน (ชำระแล้ว/รอดำเนินการ/ยังไม่ชำระ)</li>
                <li>การกระจายตามเพศ</li>
                <li>การกระจายตามไซส์เสื้อ</li>
                <li>รายได้รวม</li>
              </ul>

              <h4 className="font-semibold">การใช้งาน:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>ดูกราฟและตัวเลขสถิติ</li>
                <li>ใช้สำหรับวางแผนและตัดสินใจ</li>
                <li>ติดตามความคืบหนา</li>
              </ul>
            </CardContent>
          </Card>

    
       

          {/* ข้อควรระวัง */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                ข้อควรระวังและข้อปฏิบัติ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-semibold text-red-800 mb-2">ข้อควรระวัง:</h4>
                <ul className="list-disc list-inside space-y-1 ml-4 text-red-700">
                  <li>ตรวจสอบข้อมูลให้ถูกต้องก่อนบันทึก</li>
                
                </ul>
              </div>

             
            </CardContent>
          </Card>

         
        </div>

        {/* ปุ่มกลับ */}
        <div className="mt-8 text-center">
          <Button asChild size="lg">
            <Link href="/">เริ่มใช้งานระบบ</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
