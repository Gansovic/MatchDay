import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

const PRESET_COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Green', value: '#10b981' },
  { name: 'Yellow', value: '#f59e0b' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Cyan', value: '#06b6d4' },
];

export const ColorPicker: React.FC<ColorPickerProps> = ({ selectedColor, onColorChange }) => {
  const [customColor, setCustomColor] = React.useState('');
  const [showCustomInput, setShowCustomInput] = React.useState(false);

  const isValidHex = (color: string) => /^#[0-9A-Fa-f]{6}$/.test(color);

  const handleCustomColorSubmit = () => {
    if (isValidHex(customColor)) {
      onColorChange(customColor);
      setShowCustomInput(false);
    }
  };

  const isPresetColor = PRESET_COLORS.some((c) => c.value === selectedColor);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Team Color</Text>

      {/* Preset Colors */}
      <View style={styles.colorsGrid}>
        {PRESET_COLORS.map((color) => (
          <TouchableOpacity
            key={color.value}
            style={[
              styles.colorButton,
              { backgroundColor: color.value },
              selectedColor === color.value && styles.colorButtonSelected,
            ]}
            onPress={() => {
              onColorChange(color.value);
              setShowCustomInput(false);
            }}
          >
            {selectedColor === color.value && <View style={styles.checkmark} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Custom Color Option */}
      <TouchableOpacity
        style={[styles.customButton, !isPresetColor && styles.customButtonActive]}
        onPress={() => setShowCustomInput(!showCustomInput)}
      >
        <View style={[styles.customColorPreview, { backgroundColor: selectedColor }]} />
        <Text style={styles.customButtonText}>
          {showCustomInput ? 'Hide Custom' : 'Custom Color'}
        </Text>
        <Text style={styles.currentColor}>{selectedColor}</Text>
      </TouchableOpacity>

      {/* Custom Color Input */}
      {showCustomInput && (
        <View style={styles.customInputContainer}>
          <TextInput
            style={styles.customInput}
            placeholder="#FF5500"
            placeholderTextColor="#666"
            value={customColor}
            onChangeText={setCustomColor}
            autoCapitalize="characters"
            maxLength={7}
          />
          <TouchableOpacity
            style={[styles.applyButton, !isValidHex(customColor) && styles.applyButtonDisabled]}
            onPress={handleCustomColorSubmit}
            disabled={!isValidHex(customColor)}
          >
            <Text style={styles.applyButtonText}>Apply</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  colorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorButtonSelected: {
    borderWidth: 3,
    borderColor: '#fff',
  },
  checkmark: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  customButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
    gap: 8,
  },
  customButtonActive: {
    borderColor: '#3b82f6',
  },
  customColorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  customButtonText: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
  },
  currentColor: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
  customInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  customInput: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#fff',
    fontFamily: 'monospace',
  },
  applyButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
  },
  applyButtonDisabled: {
    backgroundColor: '#333',
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
