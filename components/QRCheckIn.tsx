import { useState } from "react";
import { View, Text, Modal, Pressable, Platform, TextInput } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useTranslation } from "react-i18next";
import { COLORS } from "@/constants/colors";

/** Talent : affiche son QR de présence (lisible sur web et natif). */
export function QRDisplayModal({
  visible,
  token,
  onClose,
}: {
  visible: boolean;
  token: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/60 justify-end" onPress={onClose}>
        <Pressable className="bg-light-surface rounded-t-card p-6 items-center gap-4" onPress={() => {}}>
          <Text className="text-ink font-bold text-lg">{t("engagement.showQR")}</Text>
          <View className="bg-white p-4 rounded-card">
            <QRCode value={token} size={220} />
          </View>
          <Text className="text-ink-muted text-sm text-center">{t("engagement.qrHint")}</Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** Entreprise : scanne le QR (caméra sur natif, saisie manuelle en repli/web). */
export function ScannerModal({
  visible,
  onClose,
  onToken,
}: {
  visible: boolean;
  onClose: () => void;
  onToken: (token: string) => void;
}) {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const [manual, setManual] = useState("");
  const isWeb = Platform.OS === "web";

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/70 justify-end" onPress={onClose}>
        <Pressable className="bg-light-surface rounded-t-card p-6 gap-4" onPress={() => {}}>
          <Text className="text-ink font-bold text-lg">{t("engagement.scanQR")}</Text>
          <Text className="text-ink-muted text-sm">{t("engagement.scanHint")}</Text>

          {!isWeb && permission?.granted ? (
            <View style={{ height: 280, borderRadius: 14, overflow: "hidden" }}>
              <CameraView
                style={{ flex: 1 }}
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={({ data }) => data && onToken(data)}
              />
            </View>
          ) : !isWeb ? (
            <Pressable onPress={requestPermission} className="h-12 rounded-md bg-primary items-center justify-center">
              <Text className="text-fg font-semibold">{t("engagement.needCamera")}</Text>
            </Pressable>
          ) : null}

          {/* Repli : saisie manuelle du token (utile sur web / dépannage) */}
          <View className="gap-2">
            <Text className="text-ink-muted text-xs">{t("engagement.manualToken")}</Text>
            <View className="flex-row gap-2">
              <TextInput
                value={manual}
                onChangeText={setManual}
                autoCapitalize="none"
                placeholder="token"
                placeholderTextColor={COLORS.inkMuted}
                className="flex-1 bg-light-bg text-ink rounded-md px-4 h-12 border border-[#E2E8F0]"
              />
              <Pressable
                onPress={() => manual.trim() && onToken(manual.trim())}
                className="px-5 h-12 rounded-md bg-primary items-center justify-center"
              >
                <Text className="text-fg font-semibold">OK</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
