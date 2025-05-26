"use client"

import { Button, FileButton, Flex, Text, TextField, View } from "@adobe/react-spectrum"
import { Heading } from "@adobe/react-spectrum"
import { Table, TableHeader, Column, TableBody, Row, Cell } from "@adobe/react-spectrum"
import { useAsyncList } from "@react-stately/data"
import { useTableState } from "@react-stately/table"
import { AlertDialog, AlertDialogBody, AlertDialogFooter, ButtonGroup, Cancel, Confirm } from "@react-spectrum/dialog"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useMutation, useQuery, useQueryClient } from "react-query"
import { useRecoilValue } from "recoil"

import {
  deletePaymentSlip as deletePaymentSlipAPI,
  getPaymentSlips,
  uploadPaymentSlip as uploadPaymentSlipAPI,
} from "@/api/payment-slip"
import { useToast } from "@/components/ui/use-toast"
import { usePersonInfo } from "@/hooks/use-person-info"
import { useSupabase } from "@/providers/supabase-provider"
import { dataSourceAtom } from "@/stores/data-source"
import type { PaymentSlip } from "@/types"

export function PaymentSlipUpload() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { personInfo } = usePersonInfo()
  const dataSource = useRecoilValue(dataSourceAtom)
  const queryClient = useQueryClient()
  const { supabaseClient } = useSupabase()

  const [paymentSlips, setPaymentSlips] = useState<PaymentSlip[]>([])
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const close = () => setIsOpen(false)
  const closeDeleteDialog = () => setIsDeleteDialogOpen(false)
  const [file, setFile] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm()

  const { data: paymentSlipsData, refetch: loadPaymentSlips } = useQuery(
    ["payment-slips", personInfo.id],
    () => getPaymentSlips(personInfo.id),
    {
      enabled: !!personInfo.id,
      onSuccess: (data) => {
        setPaymentSlips(data)
      },
    },
  )

  const uploadPaymentSlip = useMutation(uploadPaymentSlipAPI, {
    onSuccess: () => {
      queryClient.invalidateQueries(["payment-slips", personInfo.id])
      toast({
        title: t("payment_slip.upload_success"),
      })
      setUploading(false)
      reset()
      setFile(null)
    },
    onError: (error: any) => {
      toast({
        title: t("payment_slip.upload_failed"),
        description: error.message,
        variant: "destructive",
      })
      setUploading(false)
    },
  })

  const deletePaymentSlip = useMutation(deletePaymentSlipAPI, {
    onSuccess: () => {
      queryClient.invalidateQueries(["payment-slips", personInfo.id])
      toast({
        title: t("payment_slip.delete_success"),
      })
      setDeleting(false)
    },
    onError: (error: any) => {
      toast({
        title: t("payment_slip.delete_failed"),
        description: error.message,
        variant: "destructive",
      })
      setDeleting(false)
    },
  })

  const onSubmit = async (data: any) => {
    if (!file) {
      toast({
        title: t("payment_slip.no_file_selected"),
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("personId", personInfo.id)
    formData.append("description", data.description)

    uploadPaymentSlip.mutate(formData)
  }

  const onDelete = async () => {
    setDeleting(true)
    const keys = Array.from(selectedKeys)
    deletePaymentSlip.mutate({ ids: keys })
    setIsDeleteDialogOpen(false)
    setSelectedKeys(new Set())
  }

  useEffect(() => {
    if (dataSource === "supabase") {
      loadPaymentSlips()
    }
  }, [dataSource, personInfo.id])

  const list = useAsyncList({
    load: async () => {
      return {
        items: paymentSlips,
      }
    },
  })

  const tableState = useTableState({
    collection: list.collection,
    selectionMode: "multiple",
    selectedKeys,
    onSelectionChange: setSelectedKeys,
  })

  return (
    <View>
      <Flex direction="column" gap="size-200">
        <Heading level={3}>{t("payment_slip.upload_title")}</Heading>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap="size-100">
            <TextField
              label={t("payment_slip.description")}
              isRequired
              {...register("description", { required: true })}
              isInvalid={!!errors.description}
              validationMessage={errors.description ? t("payment_slip.description_required") : ""}
            />

            <FileButton
              isDisabled={uploading}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setFile(e.target.files[0])
                }
              }}
              style={{ textAlign: "left" }}
            >
              {(file) => <Text>{file ? `${file.name} (${file.size} bytes)` : t("payment_slip.choose_file")}</Text>}
            </FileButton>

            <Button type="submit" isLoading={uploading} isDisabled={uploading} width="size-1500">
              {t("payment_slip.upload")}
            </Button>
          </Flex>
        </form>

        <Flex direction="column" gap="size-200">
          <Flex alignItems="center" justifyContent="space-between">
            <Heading level={3}>{t("payment_slip.list_title")}</Heading>
            <Flex gap="size-100">
              <Button
                onPress={() => setIsDeleteDialogOpen(true)}
                isDisabled={selectedKeys.size === 0}
                variant="secondary"
                isLoading={deleting}
              >
                {t("payment_slip.delete")}
              </Button>
              <Button onPress={() => loadPaymentSlips()} variant="primary">
                {t("payment_slip.refresh")}
              </Button>
            </Flex>
          </Flex>

          <Table
            aria-label="Payment Slips"
            selectionMode="multiple"
            selectedKeys={selectedKeys}
            onSelectionChange={setSelectedKeys}
            items={paymentSlips}
          >
            <TableHeader>
              <Column key="description" width="flex">
                {t("payment_slip.description")}
              </Column>
              <Column key="file_name" width="flex">
                {t("payment_slip.file_name")}
              </Column>
              <Column key="created_at" width="flex">
                {t("payment_slip.created_at")}
              </Column>
            </TableHeader>
            <TableBody>
              {(item) => (
                <Row key={item.id}>
                  <Cell>{item.description}</Cell>
                  <Cell>
                    <a href={item.file_url} target="_blank" rel="noopener noreferrer">
                      {item.file_name}
                    </a>
                  </Cell>
                  <Cell>{item.created_at}</Cell>
                </Row>
              )}
            </TableBody>
          </Table>
        </Flex>
      </Flex>

      <AlertDialog isOpen={isDeleteDialogOpen} onDismiss={closeDeleteDialog}>
        <AlertDialogBody>
          <Text>{t("payment_slip.delete_confirmation", { count: selectedKeys.size })}</Text>
        </AlertDialogBody>
        <AlertDialogFooter>
          <ButtonGroup>
            <Cancel onPress={closeDeleteDialog}>{t("cancel")}</Cancel>
            <Confirm variant="primary" onPress={onDelete}>
              {t("delete")}
            </Confirm>
          </ButtonGroup>
        </AlertDialogFooter>
      </AlertDialog>
    </View>
  )
}
