import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { Avatar, FullLoader, VerifiedBadge } from '@/components/ui';
import { COLORS } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/store/useSession';
import type { Tables } from '@/lib/database.types';

type Message = Tables<'messages'>;

export default function Chat() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { profile } = useSession();
  const me = profile?.id;

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  // Métadonnées du match (interlocuteur, gate de modération, titre mission)
  const match = useQuery({
    queryKey: ['match', matchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select(
          '*, mission:missions(title), company:profiles!matches_company_id_fkey(id, full_name, photo_url, is_verified), talent:profiles!matches_talent_id_fkey(id, full_name, photo_url, is_verified)',
        )
        .eq('id', String(matchId))
        .single();
      if (error) throw error;
      return data as any;
    },
  });

  const locked = match.data?.moderation_status === 'pending_admin';
  const other = match.data ? (profile?.role === 'talent' ? match.data.company : match.data.talent) : null;

  // Chargement initial des messages + abonnement Realtime
  useEffect(() => {
    if (!matchId || locked) return;
    let active = true;

    supabase
      .from('messages')
      .select('*')
      .eq('match_id', String(matchId))
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (active) setMessages(data ?? []);
      });

    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
        (payload) => {
          setMessages((prev) => {
            const incoming = payload.new as Message;
            if (prev.some((m) => m.id === incoming.id)) return prev;
            return [...prev, incoming];
          });
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [matchId, locked]);

  async function send() {
    const body = text.trim();
    if (!body || !me) return;
    setText('');
    const { error } = await supabase.from('messages').insert({
      match_id: String(matchId),
      sender_id: me,
      body,
    });
    if (error) setText(body); // restaure en cas d'échec (gate fermé, réseau…)
  }

  if (match.isLoading) return <FullLoader light />;

  return (
    <SafeAreaView className="flex-1 bg-light-bg" edges={['top', 'bottom']}>
      {/* En-tête */}
      <View className="flex-row items-center gap-3 px-4 py-3 bg-light-surface border-b border-[#E2E8F0]">
        <Pressable onPress={() => router.back()} className="pr-1">
          <Text className="text-primary text-2xl">‹</Text>
        </Pressable>
        <Avatar id={other?.id ?? String(matchId)} name={other?.full_name} uri={other?.photo_url} size={40} />
        <View className="flex-1">
          <View className="flex-row items-center gap-1">
            <Text className="text-ink font-semibold text-base" numberOfLines={1}>
              {other?.full_name ?? '—'}
            </Text>
            {other?.is_verified ? <VerifiedBadge size={14} /> : null}
          </View>
          <Text className="text-ink-muted text-xs" numberOfLines={1}>
            {match.data?.mission?.title ?? ''}
          </Text>
        </View>
      </View>

      {locked ? (
        <View className="flex-1 items-center justify-center px-8 gap-2">
          <Text style={{ fontSize: 44 }}>🔒</Text>
          <Text className="text-ink font-semibold text-lg text-center">{t('chat.locked')}</Text>
          <Text className="text-ink-muted text-center text-sm">{t('chat.lockedDesc')}</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
          keyboardVerticalOffset={8}
        >
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ padding: 16, gap: 8 }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => {
              const mine = item.sender_id === me;
              return (
                <View className={`max-w-[78%] ${mine ? 'self-end' : 'self-start'}`}>
                  <View className={`px-4 py-2.5 rounded-card ${mine ? 'bg-primary' : 'bg-light-surface border border-[#E2E8F0]'}`}>
                    <Text className={mine ? 'text-fg' : 'text-ink'}>{item.body}</Text>
                  </View>
                </View>
              );
            }}
          />

          {/* Saisie */}
          <View className="flex-row items-center gap-2 px-3 py-2 bg-light-surface border-t border-[#E2E8F0]">
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={t('chat.placeholder')}
              placeholderTextColor={COLORS.inkMuted}
              multiline
              className="flex-1 bg-light-bg text-ink rounded-card px-4 py-2.5 max-h-28"
            />
            <Pressable
              onPress={send}
              disabled={!text.trim()}
              className={`w-11 h-11 rounded-pill items-center justify-center ${text.trim() ? 'bg-primary' : 'bg-[#CBD5E1]'}`}
            >
              <Text className="text-fg text-lg">➤</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
