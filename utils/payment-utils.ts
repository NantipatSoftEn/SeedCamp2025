import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client for server-side operations
const getSupabaseServerClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

/**
 * Updates person's payment amount and status
 */
export async function updatePersonPaymentAmount(
  personId: string, 
  currentAmount: number, 
  additionalAmount: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  const newAmount = currentAmount + additionalAmount;
  
  console.log(`💰 Updating person payment amount: ${currentAmount} + ${additionalAmount} = ${newAmount}`);

  const { error: updateError } = await supabase
    .from("seedcamp_people")
    .update({
      payment_amount: newAmount,
      payment_status: "paid",
      updated_at: new Date().toISOString(),
    })
    .eq("id", personId);

  if (updateError) {
    console.error("❌ Failed to update person payment amount:", updateError);
    return { success: false, error: updateError.message };
  } else {
    console.log("✅ Person payment amount updated successfully");
    return { success: true };
  }
}
