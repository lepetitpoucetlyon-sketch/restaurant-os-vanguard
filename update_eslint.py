import json

with open('.eslintrc.json', 'r') as f:
    config = json.load(f)

config['rules']['@typescript-eslint/no-explicit-any'] = 'error'
config['rules']['@typescript-eslint/no-unsafe-argument'] = 'error'
config['rules']['@typescript-eslint/no-unsafe-assignment'] = 'error'
config['rules']['@typescript-eslint/no-unsafe-call'] = 'error'
config['rules']['@typescript-eslint/no-unsafe-member-access'] = 'error'
config['rules']['@typescript-eslint/no-unsafe-return'] = 'error'

with open('.eslintrc.json', 'w') as f:
    json.dump(config, f, indent=2)
