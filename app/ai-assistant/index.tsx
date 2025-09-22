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
import { notificationAPI, aiService } from "../../services/api";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../app/auth/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { spacing, borderRadius, typography } from "../../constants/theme";
import { useRouter } from "expo-router";
import MarkdownRenderer from "../../components/ui/MarkdownRenderer";
import type { ProactiveInsight } from "../../services/api/aiAPI";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface MonthlyReport {
  userId: string;
  reportMonth: string;
  generatedAt: string;
  reportData: {
    totalIncome: number;
    totalExpenses: number;
    netFlow: number;
    transactionCount: number;
    topCategories: { category: string; amount: number; count: number }[];
    topMerchants: { merchant: string; amount: number; count: number }[];
    monthlyInsights: string;
    trends: {
      incomeChange: number;
      expenseChange: number;
    };
  };
}


export default function AIAssistantScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [proactiveInsights, setProactiveInsights] = useState<ProactiveInsight[]>([]);
  const [conversationStarters, setConversationStarters] = useState<string[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [showInsights, setShowInsights] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  // Fetch chat history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await aiService.getAIChatHistory();
        if (res.history && res.history.length > 0) {
          setMessages(
            res.history.map((msg: any) => ({
              role: msg.role,
              content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) || "Invalid message",
            })).filter((msg: any) => msg.content && typeof msg.content === 'string')
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
    
    const fetchMonthlyReport = async () => {
      try {
        // Wait for authentication to be ready
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if we have valid tokens before making the request
        const { tokenManager } = await import('../../services/tokenManager');
        
        // Try to get a valid token, but don't proceed if network issues prevent token refresh
        let token: string | null = null;
        try {
          token = await tokenManager.getValidAccessToken();
        } catch (tokenError: any) {
          // If token refresh fails due to network issues, skip the API call
          if (tokenError.code === 'ERR_NETWORK' || tokenError.message?.includes('Network Error')) {
            console.log('[AI Assistant] Token refresh failed due to network issues - skipping monthly report fetch');
            return;
          }
          throw tokenError; // Re-throw non-network errors
        }
        
        if (!token) {
          console.log('[AI Assistant] No valid token available for monthly report - skipping');
          return;
        }
        
        setReportLoading(true);
        const reportData = await notificationAPI.getMonthlyReport('latest');
        if (reportData.report) {
          setMonthlyReport(reportData.report);
        } else if (reportData.hasReports === false) {
          // Feature not available yet - this is expected
          return;
        }
      } catch (error: any) {
        // Silently handle monthly reports unavailability (expected in development)
        // The error is already handled gracefully in the API layer
        if (error.response?.status === 401) {
          console.log('[AI Assistant] Monthly report authentication failed - likely due to network issues during token refresh');
        } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
          console.log('[AI Assistant] Network error prevented monthly report fetch - will retry later');
        }
      } finally {
        setReportLoading(false);
      }
    };
    
    fetchHistory();
    fetchMonthlyReport();

    // Fetch proactive insights and conversation starters
    const fetchProactiveData = async () => {
      if (!user?.id) {
        setInsightsLoading(false);
        return;
      }

      try {
        console.log('🧠 [AI Assistant] Loading proactive insights...');
        const [insights, starters] = await Promise.allSettled([
          aiService.generateProactiveInsights(user.id),
          aiService.getConversationStarters(user.id)
        ]);

        if (insights.status === 'fulfilled') {
          setProactiveInsights(insights.value);
          console.log(`✅ [AI Assistant] Loaded ${insights.value.length} proactive insights`);
        }

        if (starters.status === 'fulfilled') {
          setConversationStarters(starters.value);
          console.log(`✅ [AI Assistant] Loaded ${starters.value.length} conversation starters`);
        }
      } catch (error) {
        console.error('❌ [AI Assistant] Error loading proactive data:', error);
      } finally {
        setInsightsLoading(false);
      }
    };

    fetchProactiveData();
  }, [user?.id]);

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const sendMessage = async (messageText?: string) => {
    const messageToSend = messageText || input.trim();
    if (!messageToSend || loading) return;

    const userMessage: Message = { role: "user", content: messageToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setShowInsights(false); // Hide insights after first message
    
    try {
      // Save user message (don't block on failure)
      const saveResult = await aiService.saveAIChatMessage("user", userMessage.content);
      if (saveResult.fallback && __DEV__) {
        console.log("💾 User message not saved to server:", saveResult.message);
      }
      
      // Get AI insight (with fallback support)
      const res = await aiService.getAIInsight(messageToSend);
      const aiMessage: Message = {
        role: "assistant",
        content: res.answer || "Sorry, I couldn't generate an answer.",
      };
      
      setMessages((prev) => [...prev, aiMessage]);
      
      // Save AI response (don't block on failure)
      const saveAIResult = await aiService.saveAIChatMessage("assistant", aiMessage.content);
      if (saveAIResult.fallback && __DEV__) {
        console.log("💾 AI message not saved to server:", saveAIResult.message);
      }
      
      // Log if using fallback response for debugging
      if (res.fallback && __DEV__) {
        console.log("🤖 Using fallback AI response:", res.error || res.message);
      }
      
    } catch (err: any) {
      console.error("❌ AI Assistant error:", err);
      
      // Try to get a fallback response instead of generic error
      try {
        console.log("🤖 Attempting fallback response for error...");
        const fallbackRes = await aiService.getAIInsight(messageToSend);
        
        if (fallbackRes.success && fallbackRes.answer) {
          // Use the fallback response
          const aiMessage: Message = {
            role: "assistant",
            content: fallbackRes.answer,
          };
          setMessages((prev) => [...prev, aiMessage]);
          
          if (fallbackRes.isFallback && __DEV__) {
            console.log("🤖 Successfully used fallback response");
          }
          
          // Try to save the fallback response
          try {
            await aiService.saveAIChatMessage("assistant", aiMessage.content);
          } catch (saveError) {
            console.log("Failed to save fallback message:", saveError);
          }
        } else {
          throw new Error("Fallback also failed");
        }
      } catch (fallbackErr) {
        console.error("❌ Fallback also failed:", fallbackErr);
        
        // Only show generic error if fallback completely fails
        const errorMsg = "I'm experiencing some technical difficulties. Please try again in a moment, or check your internet connection.";
        
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: errorMsg },
        ]);
        
        // Try to save error message (don't throw if it fails)
        try {
          await aiService.saveAIChatMessage("assistant", errorMsg);
        } catch (saveError) {
          console.log("Failed to save error message:", saveError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (loading) return;
    
    try {
      const clearResult = await aiService.clearAIChatHistory();
      if (clearResult.fallback && __DEV__) {
        console.log("🗑️ Chat history not cleared on server:", clearResult.message);
      }
    } catch (error) {
      console.log("Failed to clear chat history on server:", error);
    }
    
    // Always clear locally regardless of server response
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
      {/* Enhanced Modern Header */}
      <View style={{
        backgroundColor: colors.background.primary,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.background.secondary,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.primary[500]} />
          </TouchableOpacity>
          
          <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 16 }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 4,
            }}>
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.primary[500] + '15',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 8,
              }}>
                <Ionicons name="sparkles" size={18} color={colors.primary[500]} />
              </View>
              <Text style={{
                fontSize: 20,
                fontWeight: '800',
                color: colors.text.primary,
              }}>AI Assistant</Text>
            </View>
            <Text style={{
              fontSize: 14,
              color: colors.text.secondary,
              textAlign: 'center',
            }}>Financial insights & advice</Text>
          </View>
          
          <TouchableOpacity
            onPress={handleClearChat}
            disabled={loading}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: loading ? colors.background.tertiary : colors.error[500] + '15',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: loading ? 0.5 : 1,
            }}
          >
            <Ionicons 
              name="trash-outline" 
              size={18} 
              color={loading ? colors.text.tertiary : colors.error[500]} 
            />
          </TouchableOpacity>
        </View>
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
            {/* Monthly Report Section - Optional Feature */}
            {monthlyReport && (
              <View style={{
                marginBottom: 20,
                padding: 16,
                backgroundColor: colors.background.secondary,
                borderRadius: borderRadius.xl,
                borderWidth: 1,
                borderColor: colors.primary[500] + '20',
              }}>
                <TouchableOpacity
                  onPress={() => setShowReport(!showReport)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: showReport ? 16 : 0,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: colors.primary[500],
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}>
                      <Ionicons name="analytics" size={20} color="#fff" />
                    </View>
                    <View>
                      <Text style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: colors.text.primary,
                      }}>
                        {new Date(monthlyReport.reportMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Report
                      </Text>
                      <Text style={{
                        fontSize: 12,
                        color: colors.text.secondary,
                      }}>Monthly AI Financial Summary</Text>
                    </View>
                  </View>
                  <Ionicons 
                    name={showReport ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={colors.text.secondary} 
                  />
                </TouchableOpacity>

                {showReport && (
                  <View>
                    {/* Key Metrics */}
                    <View style={{
                      flexDirection: 'row',
                      marginBottom: 16,
                    }}>
                      <View style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={{ fontSize: 24, fontWeight: '700', color: colors.success[600] }}>
                          £{monthlyReport.reportData.totalIncome.toFixed(0)}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.text.secondary }}>Income</Text>
                      </View>
                      <View style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={{ fontSize: 24, fontWeight: '700', color: colors.error[600] }}>
                          £{monthlyReport.reportData.totalExpenses.toFixed(0)}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.text.secondary }}>Expenses</Text>
                      </View>
                      <View style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={{ 
                          fontSize: 24, 
                          fontWeight: '700', 
                          color: monthlyReport.reportData.netFlow >= 0 ? colors.success[600] : colors.error[600] 
                        }}>
                          £{monthlyReport.reportData.netFlow.toFixed(0)}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.text.secondary }}>Net Flow</Text>
                      </View>
                    </View>

                    {/* AI Insights */}
                    <View style={{
                      backgroundColor: colors.primary[500] + '10',
                      borderRadius: borderRadius.lg,
                      padding: 12,
                      marginBottom: 12,
                    }}>
                      <MarkdownRenderer 
                        content={monthlyReport.reportData.monthlyInsights}
                        fontSize={14}
                        lineHeight={20}
                      />
                    </View>

                    {/* Top Categories */}
                    {monthlyReport.reportData.topCategories.length > 0 && (
                      <View>
                        <Text style={{
                          fontSize: 14,
                          fontWeight: '600',
                          color: colors.text.primary,
                          marginBottom: 8,
                        }}>Top Spending Categories</Text>
                        {monthlyReport.reportData.topCategories.slice(0, 3).map((category, idx) => (
                          <View key={idx} style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingVertical: 4,
                          }}>
                            <Text style={{
                              fontSize: 13,
                              color: colors.text.secondary,
                              textTransform: 'capitalize',
                            }}>
                              {category.category}
                            </Text>
                            <Text style={{
                              fontSize: 13,
                              fontWeight: '500',
                              color: colors.text.primary,
                            }}>
                              £{category.amount.toFixed(0)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Proactive Insights Section */}
            {showInsights && messages.length <= 1 && (
              <View style={{ marginBottom: 20 }}>
                {/* Insights */}
                {proactiveInsights.length > 0 && (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '700',
                      color: colors.text.primary,
                      marginBottom: 12,
                      marginLeft: 4,
                    }}>💡 Personalized Insights</Text>

                    {proactiveInsights.slice(0, 2).map((insight, index) => {
                      const typeColors = {
                        celebration: colors.success[500],
                        warning: colors.warning[500],
                        tip: colors.primary[500],
                        suggestion: colors.secondary[500],
                        motivation: colors.accent[500]
                      };

                      const typeColor = typeColors[insight.type] || colors.primary[500];

                      return (
                        <TouchableOpacity
                          key={insight.id}
                          style={{
                            backgroundColor: colors.background.primary,
                            borderRadius: borderRadius.lg,
                            padding: 16,
                            marginBottom: 12,
                            borderLeftWidth: 4,
                            borderLeftColor: typeColor,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 3,
                            elevation: 2,
                          }}
                          onPress={() => {
                            if (insight.actionable && insight.suggestedActions.length > 0) {
                              const actionQuestion = `Help me with: ${insight.message} What specific steps should I take?`;
                              sendMessage(actionQuestion);
                            }
                          }}
                          activeOpacity={insight.actionable ? 0.7 : 1}
                        >
                          <Text style={{
                            fontSize: 16,
                            fontWeight: '700',
                            color: colors.text.primary,
                            marginBottom: 8,
                          }}>{insight.title}</Text>

                          <Text style={{
                            fontSize: 14,
                            color: colors.text.secondary,
                            lineHeight: 20,
                            marginBottom: insight.actionable ? 12 : 0,
                          }}>{insight.message}</Text>

                          {insight.actionable && insight.suggestedActions.length > 0 && (
                            <View style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              marginTop: 8,
                            }}>
                              <View style={{
                                backgroundColor: typeColor + '15',
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: borderRadius.sm,
                                marginRight: 8,
                                flexDirection: 'row',
                                alignItems: 'center',
                              }}>
                                <Ionicons name="help-circle" size={14} color={typeColor} />
                                <Text style={{
                                  fontSize: 12,
                                  fontWeight: '600',
                                  color: typeColor,
                                  marginLeft: 4,
                                }}>Tap to get help</Text>
                              </View>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Conversation Starters */}
                {conversationStarters.length > 0 && (
                  <View>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '700',
                      color: colors.text.primary,
                      marginBottom: 12,
                      marginLeft: 4,
                    }}>💬 Quick Questions</Text>

                    <View style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      marginHorizontal: -4,
                    }}>
                      {conversationStarters.slice(0, 6).map((starter, index) => (
                        <TouchableOpacity
                          key={index}
                          style={{
                            backgroundColor: colors.primary[500] + '15',
                            borderRadius: borderRadius.xl,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            margin: 4,
                            borderWidth: 1,
                            borderColor: colors.primary[500] + '30',
                            flexDirection: 'row',
                            alignItems: 'center',
                          }}
                          onPress={() => sendMessage(starter)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="chatbubble" size={14} color={colors.primary[500]} />
                          <Text style={{
                            fontSize: 14,
                            fontWeight: '500',
                            color: colors.primary[500],
                            marginLeft: 6,
                          }}>{starter}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            {messages.map((msg, idx) => (
              <Animated.View
                key={idx}
                style={{
                  marginBottom: 20,
                  flexDirection: "row",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  alignItems: 'flex-end',
                }}
              >
                {/* AI Avatar */}
                {msg.role === "assistant" && (
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: colors.primary[500],
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 8,
                    marginBottom: 4,
                  }}>
                    <Ionicons name="sparkles" size={16} color="#fff" />
                  </View>
                )}
                
                {/* Message Bubble */}
                <View style={{
                  maxWidth: "75%",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 20,
                  backgroundColor: msg.role === "user" 
                    ? colors.primary[500] 
                    : colors.background.primary,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 3,
                  elevation: 2,
                  borderBottomLeftRadius: msg.role === "assistant" ? 4 : 20,
                  borderBottomRightRadius: msg.role === "user" ? 4 : 20,
                }}>
                  {msg.role === "assistant" ? (
                    <MarkdownRenderer content={typeof msg.content === 'string' ? msg.content : 'Invalid message content'} />
                  ) : (
                    <Text style={{
                      fontSize: 16,
                      lineHeight: 22,
                      color: msg.role === "user" ? "#fff" : colors.text.primary,
                    }}>
                      {typeof msg.content === 'string' ? msg.content : 'Invalid message content'}
                    </Text>
                  )}
                </View>
                
                {/* User Avatar */}
                {msg.role === "user" && (
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: colors.background.tertiary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: 8,
                    marginBottom: 4,
                  }}>
                    <Ionicons name="person" size={16} color={colors.text.secondary} />
                  </View>
                )}
              </Animated.View>
            ))}
            {/* Enhanced Loading State */}
            {loading && (
              <Animated.View style={{
                marginBottom: 20,
                flexDirection: "row",
                justifyContent: "flex-start",
                alignItems: 'flex-end',
              }}>
                {/* AI Avatar */}
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.primary[500],
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 8,
                  marginBottom: 4,
                }}>
                  <Ionicons name="sparkles" size={16} color="#fff" />
                </View>
                
                {/* Typing Indicator */}
                <View style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 20,
                  borderBottomLeftRadius: 4,
                  backgroundColor: colors.background.primary,
                  flexDirection: "row",
                  alignItems: "center",
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 3,
                  elevation: 2,
                }}>
                  <ActivityIndicator size="small" color={colors.primary[500]} />
                  <Text style={{
                    marginLeft: 8,
                    color: colors.text.secondary,
                    fontSize: 16,
                    fontStyle: 'italic',
                  }}>AI is thinking...</Text>
                </View>
              </Animated.View>
            )}
          </ScrollView>
          {/* Enhanced Input Bar */}
          <View style={{
            position: "absolute",
            bottom: 16,
            left: 0,
            right: 0,
            paddingHorizontal: 16,
          }}>
            <View style={{
              flexDirection: "row",
              alignItems: "flex-end",
              backgroundColor: colors.background.primary,
              borderRadius: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 5,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderWidth: 1,
              borderColor: colors.border.light,
              }}
            >
              <TextInput
                style={{
                  flex: 1,
                  maxHeight: 100,
                  fontSize: 16,
                  lineHeight: 22,
                  color: colors.text.primary,
                  paddingVertical: 4,
                }}
                placeholder="Ask me about your spending, budgets, or goals..."
                placeholderTextColor={colors.text.tertiary}
                value={input}
                onChangeText={setInput}
                editable={!loading}
                onSubmitEditing={() => sendMessage()}
                returnKeyType="send"
                multiline
                textAlignVertical="center"
              />
              <TouchableOpacity
                style={{
                  marginLeft: 12,
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: (!input.trim() || loading) ? colors.background.tertiary : colors.primary[500],
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                }}
                onPress={() => sendMessage()}
                disabled={!input.trim() || loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons 
                    name="arrow-up" 
                    size={20} 
                    color={(!input.trim() || loading) ? colors.text.tertiary : "#fff"} 
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
