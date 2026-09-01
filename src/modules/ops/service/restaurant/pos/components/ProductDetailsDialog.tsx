"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Modal } from "@ui/Modal";
import { Product, OptionGroup, Option } from "@nexus/contracts";
import { useLanguage } from "@/shared/hooks";
import { useNexusFleet } from "@/shared/providers/fleet/NexusFleetProvider";
import { COMMON_ALLERGENS } from "./product-details/allergensConstants";
import { ProductHeaderBackdrop } from "./product-details/ProductHeaderBackdrop";
import { ProductOptionGroupsSection } from "./product-details/ProductOptionGroupsSection";
import { ProductAllergensSection } from "./product-details/ProductAllergensSection";
import { ProductFooterBar } from "./product-details/ProductFooterBar";

interface ProductDetailsDialogProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, selectedOptions: Record<string, Option[]>, note?: string) => void;
}

export function ProductDetailsDialog({ product, isOpen, onClose, onAddToCart }: ProductDetailsDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [note, setNote] = useState("");
  const [lastProductId, setLastProductId] = useState<string | null>(null);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [customAllergen, setCustomAllergen] = useState("");
  const [customAllergens, setCustomAllergens] = useState<string[]>([]);
  const [showAllergenInput, setShowAllergenInput] = useState(false);
  const { t } = useLanguage();
  const { priceMultiplier } = useNexusFleet();

  if (isOpen && product && product.id !== lastProductId) {
    setLastProductId(product.id);
    setQuantity(1);
    setNote("");
    setSelectedAllergens([]);
    setCustomAllergens([]);
    setCustomAllergen("");
    setShowAllergenInput(false);
    const initialSelections: Record<string, string[]> = {};
    (product.optionGroups as OptionGroup[] | undefined)?.forEach(group => {
      const defaults = group.options.filter(opt => opt.isDefault).map(opt => opt.id);
      if (defaults.length > 0) {
        initialSelections[group.id] = defaults;
      }
    });
    setSelections(initialSelections);
  }

  if (!isOpen || !product) return null;

  const toggleAllergen = (allergenId: string) => {
    setSelectedAllergens(prev =>
      prev.includes(allergenId)
        ? prev.filter(id => id !== allergenId)
        : [...prev, allergenId]
    );
  };

  const addCustomAllergen = () => {
    if (customAllergen.trim() && !customAllergens.includes(customAllergen.trim())) {
      const newAllergen = customAllergen.trim();
      setCustomAllergens(prev => [...prev, newAllergen]);
      setSelectedAllergens(prev => [...prev, `custom_${newAllergen}`]);
      setCustomAllergen("");
      setShowAllergenInput(false);
    }
  };

  const handleOptionToggle = (group: OptionGroup, optionId: string) => {
    setSelections(prev => {
      const current = prev[group.id] || [];
      if (group.type === 'single') {
        return { ...prev, [group.id]: [optionId] };
      } else {
        const isSelected = current.includes(optionId);
        let newSelection;
        if (isSelected) {
          newSelection = current.filter(id => id !== optionId);
        } else {
          if (group.maxSelections && current.length >= group.maxSelections) {
            return prev;
          }
          newSelection = [...current, optionId];
        }
        return { ...prev, [group.id]: newSelection };
      }
    });
  };

  const calculateTotal = () => {
    let total = product.priceInMicrounits || 0;
    (product.optionGroups as OptionGroup[] | undefined)?.forEach(group => {
      const selectedIds = selections[group.id] || [];
      selectedIds.forEach(id => {
        const option = group.options.find(opt => opt.id === id);
        if (option) {
          total += option.priceModifierInCents * 10_000;
        }
      });
    });
    return total * priceMultiplier * quantity;
  };

  const isValid = () => {
    if (!product.optionGroups) return true;
    return (product.optionGroups as OptionGroup[]).every(group => {
      if (group.required) {
        const selected = selections[group.id];
        return selected && selected.length >= (group.minSelections || 1);
      }
      return true;
    });
  };

  const handleAdd = () => {
    const selectedOptionsMap: Record<string, Option[]> = {};
    (product.optionGroups as OptionGroup[] | undefined)?.forEach(group => {
      const selectedIds = selections[group.id] || [];
      if (selectedIds.length > 0) {
        selectedOptionsMap[group.name] = group.options.filter(opt => selectedIds.includes(opt.id));
      }
    });

    let finalNote = note;
    if (selectedAllergens.length > 0) {
      const allergenNames = selectedAllergens.map(id => {
        if (id.startsWith('custom_')) {
          return id.replace('custom_', '');
        }
        const allergen = COMMON_ALLERGENS.find(a => a.id === id);
        return allergen ? t(`allergens.${allergen.id}`) : id;
      });
      const allergenWarning = `⚠️ ALLERGIES: ${allergenNames.join(', ')}`;
      finalNote = finalNote ? `${allergenWarning}\n${note}` : allergenWarning;
    }

    onAddToCart(product, quantity, selectedOptionsMap, finalNote);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      className="p-0 border-none bg-transparent"
      showClose={false}
      noPadding
    >
      <div className="bg-bg-secondary rounded-[48px] shadow-premium w-full flex flex-col overflow-hidden scale-100 border border-border/50 transition-colors max-h-[92vh]">
        <ProductHeaderBackdrop
          product={product}
          priceMultiplier={priceMultiplier}
          t={t}
          onClose={onClose}
        />

        <div className="flex-1 overflow-y-auto p-8 md:p-12 bg-bg-primary transition-colors scrollbar-hide elegant-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <ProductOptionGroupsSection
              optionGroups={product.optionGroups as OptionGroup[] | undefined}
              selections={selections}
              onOptionToggle={handleOptionToggle}
              t={t}
            />

            <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-border">
              <ProductAllergensSection
                selectedAllergens={selectedAllergens}
                customAllergen={customAllergen}
                showAllergenInput={showAllergenInput}
                onToggleAllergen={toggleAllergen}
                onChangeCustomAllergen={setCustomAllergen}
                onAddCustomAllergen={addCustomAllergen}
                onOpenAllergenInput={() => setShowAllergenInput(true)}
                t={t}
              />

              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-4">
                    <Sparkles className="w-5 h-5 text-accent-gold" />
                    <h3 className="text-xs md:text-sm font-black text-text-primary uppercase tracking-[0.3em]">
                      {t('pos.details.notes')}
                    </h3>
                  </div>
                </div>
                <div className="relative group h-full">
                  <textarea
                    placeholder={t('pos.details.notes_placeholder')}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full h-[calc(100%-2rem)] bg-bg-tertiary/40 border border-border rounded-[32px] p-6 text-sm md:text-base font-serif italic text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent-gold/50 transition-all resize-none min-h-[200px]"
                  />
                  <div className="absolute top-6 right-6 h-2 w-2 rounded-full bg-accent-gold/20 group-focus-within:bg-accent-gold group-focus-within:animate-pulse transition-all" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <ProductFooterBar
          quantity={quantity}
          totalInMicrounits={calculateTotal()}
          isValid={isValid()}
          onDecrement={() => setQuantity(Math.max(1, quantity - 1))}
          onIncrement={() => setQuantity(quantity + 1)}
          onAdd={handleAdd}
          t={t}
        />
      </div>
    </Modal>
  );
}
