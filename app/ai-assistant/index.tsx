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
import { bankingAPI, notificationAPI } from "../../services/api";
import { useTheme } from "../../contexts/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { spacing, borderRadius, typography } from "../../constants/theme";
import { useRouter } from "expo-router";
import MarkdownRenderer from "../../components/ui/MarkdownRenderer";

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
    topCategories: Array<{ category: string; amount: number; count: number }>;
    topMerchants: Array<{ merchant: string; amount: number; count: number }>;
    monthlyInsights: string;
    trends: {
      incomeChange: number;
      expenseChange: number;
    };
  };
}


export default function AIAssistantScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
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
    
    const fetchMonthlyReport = async () => {
      try {
        setReportLoading(true);
        const reportData = await notificationAPI.getMonthlyReport('latest');
        if (reportData.report) {
          setMonthlyReport(reportData.report);
        } else if (reportData.hasReports === false) {
          // Feature not available yet - this is expected
          return;
        }
      } catch (error: any) {
        // Only log unexpected errors (not 404s which are handled in API)
        console.log('Monthly reports unavailable:', error?.message || error);
      } finally {
        setReportLoading(false);
      }
    };
    
    fetchHistory();
    fetchMonthlyReport();
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
                    <MarkdownRenderer content={msg.content} />
                  ) : (
                    <Text style={{
                      fontSize: 16,
                      lineHeight: 22,
                      color: msg.role === "user" ? "#fff" : colors.text.primary,
                    }}>
                      {msg.content}
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
                onSubmitEditing={sendMessage}
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
                onPress={sendMessage}
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
