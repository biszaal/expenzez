import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { bankingAPI } from "../../services/api";
import { useTheme } from "../../contexts/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { spacing, borderRadius, typography } from "../../constants/theme";
import { useRouter } from "expo-router";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AIAssistantScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Fetch chat history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await bankingAPI.getAIChatHistory();
        if (res.history && res.history.length > 0) {
          setMessages(
            res.history.map((msg: any) => ({
              role: msg.role,
              content: msg.content,
            }))
          );
        } else {
          setMessages([
            {
              role: "assistant",
              content:
                "Hi! I'm your AI finance assistant. Ask me anything about your spending, budgets, or financial goals!",
            },
          ]);
        }
      } catch (e) {
        setMessages([
          {
            role: "assistant",
            content:
              "Hi! I'm your AI finance assistant. Ask me anything about your spending, budgets, or financial goals!",
          },
        ]);
      }
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    try {
      await bankingAPI.saveAIChatMessage("user", userMessage.content);
      const res = await bankingAPI.getAIInsight(userMessage.content);
      const aiMessage: Message = {
        role: "assistant",
        content: res.answer || "Sorry, I couldn't generate an answer.",
      };
      setMessages((prev) => [...prev, aiMessage]);
      await bankingAPI.saveAIChatMessage("assistant", aiMessage.content);
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message || "Sorry, something went wrong.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: errorMsg },
      ]);
      await bankingAPI.saveAIChatMessage("assistant", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (loading) return;
    await bankingAPI.clearAIChatHistory();
    setMessages([
      {
        role: "assistant",
        content:
          "Hi! I'm your AI finance assistant. Ask me anything about your spending, budgets, or financial goals!",
      },
    ]);
    if (scrollViewRef.current) {
      setTimeout(
        () => scrollViewRef.current?.scrollToEnd({ animated: true }),
        100
      );
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background.secondary }}
    >
      {/* Consistent Header with Back Button */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.xl,
          paddingBottom: spacing.md,
          backgroundColor: colors.background.primary,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.light,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginRight: spacing.lg, padding: spacing.sm }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: typography.fontSizes["2xl"],
              fontWeight: "700",
              color: colors.text.primary,
            }}
          >
            AI Finance Assistant
          </Text>
          <Text
            style={{
              fontSize: typography.fontSizes.sm,
              color: colors.text.secondary,
              marginTop: spacing.xs,
            }}
          >
            Ask anything about your spending, budgets, or financial goals.
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleClearChat}
          disabled={loading}
          style={{
            marginLeft: spacing.lg,
            padding: spacing.sm,
            opacity: loading ? 0.5 : 1,
          }}
        >
          <Text
            style={{
              color: colors.primary[500],
              fontWeight: "600",
              fontSize: typography.fontSizes.base,
            }}
          >
            Clear Chat
          </Text>
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <View
          style={{
            flex: 1,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: spacing.md,
          }}
        >
          <ScrollView
            ref={scrollViewRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((msg, idx) => (
              <Animated.View
                key={idx}
                style={{
                  marginBottom: spacing.lg,
                  flexDirection: "row",
                  justifyContent:
                    msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <View
                  style={{
                    maxWidth: "80%",
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.md,
                    borderRadius: borderRadius.xl,
                    backgroundColor:
                      msg.role === "user"
                        ? colors.primary[500]
                        : colors.background.primary,
                    shadowColor: colors.shadow.light,
                    shadowOpacity: 0.08,
                    shadowRadius: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: typography.fontSizes.base,
                      color:
                        msg.role === "user"
                          ? colors.text.inverse
                          : colors.text.primary,
                    }}
                  >
                    {msg.content}
                  </Text>
                </View>
              </Animated.View>
            ))}
            {loading && (
              <View
                style={{
                  marginBottom: spacing.lg,
                  flexDirection: "row",
                  justifyContent: "flex-start",
                }}
              >
                <View
                  style={{
                    maxWidth: "80%",
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.md,
                    borderRadius: borderRadius.xl,
                    backgroundColor: colors.background.primary,
                    flexDirection: "row",
                    alignItems: "center",
                    shadowColor: colors.shadow.light,
                    shadowOpacity: 0.08,
                    shadowRadius: 4,
                  }}
                >
                  <ActivityIndicator size="small" color={colors.primary[500]} />
                  <Text
                    style={{
                      marginLeft: spacing.sm,
                      color: colors.text.primary,
                    }}
                  >
                    Thinking...
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
          {/* Consistent Input Bar */}
          <View
            style={{
              position: "absolute",
              bottom: 24,
              left: 0,
              right: 0,
              paddingHorizontal: spacing.xl,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.background.primary,
                borderRadius: borderRadius.xl,
                shadowColor: colors.shadow.light,
                shadowOpacity: 0.08,
                shadowRadius: 4,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                borderWidth: 1,
                borderColor: colors.border.light,
              }}
            >
              <TextInput
                style={{
                  flex: 1,
                  fontSize: typography.fontSizes.base,
                  color: colors.text.primary,
                }}
                placeholder="Ask me anything about your finances..."
                placeholderTextColor={colors.text.tertiary}
                value={input}
                onChangeText={setInput}
                editable={!loading}
                onSubmitEditing={sendMessage}
                returnKeyType="send"
              />
              <TouchableOpacity
                style={{
                  marginLeft: spacing.sm,
                  padding: spacing.sm,
                  borderRadius: 999,
                  backgroundColor: colors.primary[500],
                  opacity: !input.trim() || loading ? 0.5 : 1,
                }}
                onPress={sendMessage}
                disabled={!input.trim() || loading}
              >
                <Ionicons name="send" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
