with open('src/modules/human/hr/services/paySlipGenerator.ts', 'r') as f:
    content = f.read()

content = content.replace("const finalY = doc.lastAutoTable.finalY + 10;", "// @ts-expect-error\n    const finalY = doc.lastAutoTable.finalY + 10;")
content = content.replace("const finalYSignature = doc.lastAutoTable.finalY + 10;", "// @ts-expect-error\n    const finalYSignature = doc.lastAutoTable.finalY + 10;")

with open('src/modules/human/hr/services/paySlipGenerator.ts', 'w') as f:
    f.write(content)
