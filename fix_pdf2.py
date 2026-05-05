with open('src/modules/human/hr/services/paySlipGenerator.ts', 'r') as f:
    content = f.read()

content = content.replace("const finalY2 = doc.lastAutoTable.finalY + 10;", "// @ts-expect-error\n    const finalY2 = doc.lastAutoTable.finalY + 10;")
content = content.replace("doc.lastAutoTable.finalY + 10", "(doc as Any).lastAutoTable.finalY + 10")

with open('src/modules/human/hr/services/paySlipGenerator.ts', 'w') as f:
    f.write(content)
