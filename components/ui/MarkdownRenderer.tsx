import React, { ReactNode } from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface MarkdownRendererProps {
  content: string;
  fontSize?: number;
  lineHeight?: number;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  fontSize = 16, 
  lineHeight = 22 
}) => {
  const { colors } = useTheme();

  const renderContent = (text: string) => {
    // Split content into lines and process each one
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      if (trimmedLine === '') {
        // Empty line - add small spacing
        elements.push(
          <View key={`space-${index}`} style={{ height: 4 }} />
        );
        return;
      }

      // Check for heading (### heading)
      const headingMatch = trimmedLine.match(/^(#{1,6})\s*(.+)/);
      if (headingMatch) {
        const [, hashes, text] = headingMatch;
        const level = hashes.length;

        // Calculate font size and weight based on heading level
        const headingFontSize = level === 1 ? fontSize + 8 :
                               level === 2 ? fontSize + 6 :
                               level === 3 ? fontSize + 4 :
                               level === 4 ? fontSize + 2 :
                               fontSize + 1;

        elements.push(
          <Text key={`heading-${index}`} style={{
            fontSize: headingFontSize,
            fontWeight: level <= 2 ? '800' : level <= 4 ? '700' : '600',
            color: colors.text.primary,
            marginTop: level <= 2 ? 16 : 12,
            marginBottom: level <= 2 ? 12 : 8,
          }}>
            {formatInlineText(text)}
          </Text>
        );
        return;
      }

      // Check for numbered list item (1. 2. 3. etc.)
      const numberedListMatch = trimmedLine.match(/^(\d+)\.\s*(.+)/);
      if (numberedListMatch) {
        const [, number, text] = numberedListMatch;
        elements.push(
          <View key={`list-${index}`} style={{ 
            flexDirection: 'row', 
            marginBottom: 12,
            alignItems: 'flex-start',
            paddingLeft: 0,
          }}>
            <Text style={{
              fontSize,
              fontWeight: '600',
              color: colors.primary[500],
              marginRight: 8,
              minWidth: 20,
            }}>
              {number}.
            </Text>
            <Text style={{
              fontSize,
              lineHeight,
              color: colors.text.primary,
              flex: 1,
            }}>
              {formatInlineText(text)}
            </Text>
          </View>
        );
        return;
      }

      // Check for bullet list item (- or * or •)
      const bulletListMatch = trimmedLine.match(/^[-*•]\s*(.+)/);
      if (bulletListMatch) {
        const [, text] = bulletListMatch;
        elements.push(
          <View key={`bullet-${index}`} style={{ 
            flexDirection: 'row', 
            marginBottom: 8,
            alignItems: 'flex-start',
            paddingLeft: 0,
          }}>
            <Text style={{
              fontSize,
              fontWeight: '600',
              color: colors.primary[500],
              marginRight: 8,
              minWidth: 12,
            }}>
              •
            </Text>
            <Text style={{
              fontSize,
              lineHeight,
              color: colors.text.primary,
              flex: 1,
            }}>
              {formatInlineText(text)}
            </Text>
          </View>
        );
        return;
      }

      // Regular paragraph
      elements.push(
        <Text key={`para-${index}`} style={{
          fontSize,
          lineHeight,
          color: colors.text.primary,
          marginBottom: 8,
        }}>
          {formatInlineText(trimmedLine)}
        </Text>
      );
    });

    return elements;
  };

  const formatInlineText = (text: string): ReactNode[] => {
    const parts: ReactNode[] = [];
    
    // Process both **bold** and *italic* text
    const combinedRegex = /(\*\*(.*?)\*\*)|(\*(.*?)\*)/g;
    let lastIndex = 0;
    let match;
    let keyIndex = 0;
    
    while ((match = combinedRegex.exec(text)) !== null) {
      // Add text before the formatted part
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      
      if (match[1]) {
        // Bold text (**text**)
        parts.push(
          <Text key={`bold-${keyIndex++}`} style={{ 
            fontWeight: '700', 
            color: colors.text.primary 
          }}>
            {match[2]}
          </Text>
        );
      } else if (match[3]) {
        // Italic text (*text*)
        parts.push(
          <Text key={`italic-${keyIndex++}`} style={{ 
            fontStyle: 'italic', 
            color: colors.text.primary 
          }}>
            {match[4]}
          </Text>
        );
      }
      
      lastIndex = combinedRegex.lastIndex;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    
    // If no formatted text was found, return the original text
    if (parts.length === 0) {
      parts.push(text);
    }
    
    return parts;
  };

  return (
    <View>
      {renderContent(content) as ReactNode[]}
    </View>
  );
};

export default MarkdownRenderer;