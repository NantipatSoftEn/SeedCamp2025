"use client"

import { Button } from "@/components/ui/button"
import { FileText, AlertCircle, Users, BarChart3, Upload } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function DocsModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2" title="เอกสารการใช้งาน - อ่านก่อนใช้ระบบ">
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">เอกสารการใช้งาน</span>
          <span className="sm:hidden">คู่มือ</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">เอกสารการใช้งานระบบ SeedCamp 2025</DialogTitle>
          <DialogDescription>คู่มือการใช้งานระบบจัดการข้อมูลผู้เข้าร่วม</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-full pr-4">
          <div className="space-y-6 pb-6">
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>สำคัญ:</strong> กรุณาอ่านเอกสารนี้ให้ครบถ้วนก่อนเริ่มใช้งานระบบ เพื่อความถูกต้องและปลอดภัยของข้อมูล
              </AlertDescription>
            </Alert>

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
                    <strong>โรคประจำตัว:</strong> สำหรับการดูแลเฉพาะ
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

            {/* ฟีเจอร์สำหรับ Admin */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  ฟีเจอร์สำหรับผู้ดูแลระบบ (Admin)
                </CardTitle>
                <CardDescription>เฉพาะบัญชี admin@seedbkk.org เท่านั้น</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <h4 className="font-semibold">Import Data:</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>นำเข้าข้อมูลจากไฟล์ CSV</li>
                  <li>ตรวจสอบรูปแบบไฟล์ให้ถูกต้อง</li>
                  <li>ระวังการเขียนทับข้อมูลเดิม</li>
                </ul>

                <h4 className="font-semibold">ปุ่มทดสอบระบบ:</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>
                    <strong>Test Supabase:</strong> ทดสอบการเชื่อมต่อฐานข้อมูล
                  </li>
                  <li>
                    <strong>Test Storage:</strong> ทดสอบการอัปโหลดไฟล์
                  </li>
                  <li>
                    <strong>AuthTest:</strong> ทดสอบระบบยืนยันตัวตน
                  </li>
                  <li>
                    <strong>Live:</strong> สลับระหว่างข้อมูลจริงและข้อมูลทดสอบ
                  </li>
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
                    <li>อย่าลบข้อมูลโดยไม่จำเป็น</li>
                    <li>สำรองข้อมูลสำคัญเป็นประจำ</li>
                    <li>ไม่แชร์รหัสผ่านกับผู้อื่น</li>
                    <li>ออกจากระบบเมื่อใช้งานเสร็จ</li>
                  </ul>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">แนวปฏิบัติที่ดี:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-green-700">
                    <li>ตรวจสอบข้อมูลซ้ำก่อนบันทึก</li>
                    <li>ใช้ฟีเจอร์ค้นหาเพื่อหาข้อมูลเร็วขึ้น</li>
                    <li>อัปเดตสถานะการชำระเงินให้เป็นปัจจุบัน</li>
                    <li>ตรวจสอบสลิปการชำระเงินก่อนอนุมัติ</li>
                    <li>ใช้ Analytics เพื่อติดตามความคืบหน้า</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* ติดต่อสอบถาม */}
            <Card>
              <CardHeader>
                <CardTitle>ติดต่อสอบถาม</CardTitle>
              </CardHeader>
              <CardContent>
                <p>หากมีปัญหาหรือข้อสงสัยในการใช้งานระบบ กรุณาติดต่อ:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>ทีมพัฒนาระบบ SeedCamp 2025</li>
                  <li>อีเมล: admin@seedbkk.org</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
        <div className="flex justify-end mt-4">
          <DialogClose asChild>
            <Button>ปิด</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
