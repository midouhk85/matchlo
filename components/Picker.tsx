import { useState } from 'react';
import { View, Text, Pressable, Modal, FlatList } from 'react-native';

/**
 * Champ de sélection unique via modale (wilaya, secteur, genre…).
 * Marges start/end-friendly, thème sombre.
 */
export function SelectField({
  label,
  value,
  placeholder = '—',
  options,
  onChange,
}: {
  label?: string;
  value?: string | null;
  placeholder?: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View className="gap-2">
      {label ? <Text className="text-muted font-medium text-sm">{label}</Text> : null}
      <Pressable
        onPress={() => setOpen(true)}
        className="bg-surface-alt border border-border rounded-md h-12 px-4 flex-row items-center justify-between active:opacity-80"
      >
        <Text className={value ? 'text-fg text-base' : 'text-muted text-base'}>{value || placeholder}</Text>
        <Text className="text-muted">▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/60 justify-end" onPress={() => setOpen(false)}>
          <Pressable className="bg-surface rounded-t-card max-h-[70%] pb-6" onPress={() => {}}>
            <View className="items-center py-3">
              <View className="w-10 h-1 rounded-pill bg-border" />
            </View>
            {label ? <Text className="text-fg font-semibold text-lg px-5 pb-2">{label}</Text> : null}
            <FlatList
              data={options as string[]}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onChange(item);
                    setOpen(false);
                  }}
                  className="px-5 h-12 justify-center active:bg-surface-alt"
                >
                  <Text className={`text-base ${item === value ? 'text-primary font-semibold' : 'text-fg'}`}>
                    {item}
                  </Text>
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
