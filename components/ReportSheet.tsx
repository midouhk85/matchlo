import { useState } from "react";
import { View, Text, Modal, Pressable, TextInput } from "react-native";
import { useTranslation } from "react-i18next";
import { REPORT_REASONS } from "@/constants/data";
import { COLORS } from "@/constants/colors";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/store/useSession";
import { confirmAction, notify } from "@/lib/confirm";

/**
 * Feuille « Signaler / Bloquer » un interlocuteur (§D, anti-harcèlement).
 * Insère un `report` et/ou un `block`.
 */
export function ReportSheet({
  visible,
  targetId,
  onClose,
  onBlocked,
}: {
  visible: boolean;
  targetId: string;
  onClose: () => void;
  onBlocked?: () => void;
}) {
  const { t } = useTranslation();
  const { profile } = useSession();
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  async function report() {
    if (!profile || !reason) return;
    setBusy(true);
    try {
      await supabase.from("reports").insert({
        reporter_id: profile.id,
        target_id: targetId,
        reason,
        details: details || null,
      });
      notify(t("engagement.disputeOpened"));
      onClose();
      setReason(null);
      setDetails("");
    } catch (e: any) {
      notify(t("common.error"), e.message ?? "");
    } finally {
      setBusy(false);
    }
  }

  async function block() {
    if (!profile) return;
    setBusy(true);
    try {
      await supabase.from("blocks").insert({ blocker_id: profile.id, blocked_id: targetId });
      notify(t("engagement.blocked"));
      onClose();
      onBlocked?.();
    } catch (e: any) {
      notify(t("common.error"), e.message ?? "");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/60 justify-end" onPress={onClose}>
        <Pressable className="bg-surface rounded-t-card p-6 gap-4" onPress={() => {}}>
          <Text className="text-fg font-bold text-lg">{t("engagement.report")}</Text>
          <View className="gap-2">
            {REPORT_REASONS.map((r) => (
              <Pressable
                key={r}
                onPress={() => setReason(r)}
                className={`h-11 px-4 rounded-md flex-row items-center justify-between border ${
                  reason === r ? "border-primary bg-primary/10" : "border-border bg-surface-alt"
                }`}
              >
                <Text className={reason === r ? "text-fg font-medium" : "text-muted"}>{r}</Text>
                {reason === r ? <Text className="text-primary">✓</Text> : null}
              </Pressable>
            ))}
          </View>
          <TextInput
            value={details}
            onChangeText={setDetails}
            multiline
            placeholder="Détails (facultatif)…"
            placeholderTextColor={COLORS.muted}
            className="bg-surface-alt text-fg rounded-md px-4 py-3 min-h-[70px] border border-border"
          />
          <Pressable
            onPress={report}
            disabled={!reason || busy}
            className={`h-12 rounded-md items-center justify-center ${reason ? "bg-danger" : "bg-surface-alt"}`}
          >
            <Text className="text-fg font-semibold">{t("engagement.report")}</Text>
          </Pressable>
          <Pressable
            onPress={() => confirmAction(t("engagement.block"), "", block, { confirmLabel: t("engagement.block") })}
            className="items-center py-2"
          >
            <Text className="text-danger font-medium">⛔ {t("engagement.block")}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
