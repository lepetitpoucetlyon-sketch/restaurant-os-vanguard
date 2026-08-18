"""
🚀 RESTAURANT OS — QLORA SLM FINE-TUNING PIPELINE
Fine-tune Gemma-2-2B-it ou Qwen2.5-3B-Instruct sur GPU Cloud (A100 / RTX 4090).
Coût d'entraînement estimé : ~3$ à 5$ (durée : 1h30 à 2h30).
"""

import os
import torch
from datasets import load_dataset
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    TrainingArguments,
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from trl import SFTTrainer

# ── CONFIGURATION DU MODÈLE ───────────────────────────────────────────────────
MODEL_ID = os.getenv("BASE_MODEL_ID", "google/gemma-2-2b-it") # ou "Qwen/Qwen2.5-3B-Instruct"
DATASET_PATH = os.getenv("DATASET_PATH", "./data/slm-dataset/restaurant_os_slm_train.jsonl")
OUTPUT_DIR = os.getenv("OUTPUT_DIR", "./models/restaurant-os-slm-v1")
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "4"))
GRAD_ACCUM = int(os.getenv("GRAD_ACCUM", "4"))
EPOCHS = int(os.getenv("EPOCHS", "3"))
LEARNING_RATE = float(os.getenv("LEARNING_RATE", "2e-4"))

def train():
    print(f"⚡ Chargement du modèle de base : {MODEL_ID}")

    # 1. Configuration 4-bit (QLoRA)
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16,
        bnb_4bit_use_double_quant=True,
    )

    # 2. Chargement du Tokenizer et du Modèle
    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        MODEL_ID,
        quantization_config=bnb_config,
        device_map="auto",
        torch_dtype=torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16,
        trust_remote_code=True,
    )

    model = prepare_model_for_kbit_training(model)

    # 3. Configuration LoRA (Low-Rank Adaptation)
    peft_config = LoraConfig(
        r=16,
        lora_alpha=32,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
    )

    model = get_peft_model(model, peft_config)
    model.print_trainable_parameters()

    # 4. Chargement du Dataset
    print(f"📂 Chargement du dataset depuis {DATASET_PATH}")
    dataset = load_dataset("json", data_files=DATASET_PATH, split="train")

    def format_chat(sample):
        # Applique le template conversationnel de Gemma / Qwen
        text = tokenizer.apply_chat_template(sample["messages"], tokenize=False, add_generation_prompt=False)
        return {"text": text}

    dataset = dataset.map(format_chat)

    # 5. Arguments d'Entraînement
    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        per_device_train_batch_size=BATCH_SIZE,
        gradient_accumulation_steps=GRAD_ACCUM,
        learning_rate=LEARNING_RATE,
        lr_scheduler_type="cosine",
        warmup_ratio=0.05,
        num_train_epochs=EPOCHS,
        weight_decay=0.01,
        logging_steps=10,
        save_strategy="epoch",
        optim="paged_adamw_8bit",
        fp16=not torch.cuda.is_bf16_supported(),
        bf16=torch.cuda.is_bf16_supported(),
        report_to="none", # ou "wandb"
    )

    # 6. SFT Trainer
    trainer = SFTTrainer(
        model=model,
        train_dataset=dataset,
        peft_config=peft_config,
        dataset_text_field="text",
        max_seq_length=1024,
        tokenizer=tokenizer,
        args=training_args,
    )

    print("🚀 Début du Fine-Tuning QLoRA...")
    trainer.train()

    print(f"💾 Sauvegarde de l'adaptateur LoRA dans {OUTPUT_DIR}")
    trainer.model.save_pretrained(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)
    print("✅ Entraînement terminé avec succès !")

if __name__ == "__main__":
    train()
