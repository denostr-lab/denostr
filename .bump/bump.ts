import packageJson from '../package.json' assert { type: 'json' }

const version = Deno.readTextFileSync('.bump/version').trim()

if (version === packageJson.version) {
    Deno.exit(0)
}

for (const filename of ['./deployment/maintenance.yaml', './deployment/static-mirroring.yaml', './deployment/worker.yaml', './docker-compose.yml']) {
    const filepath = Deno.realPathSync(filename)
    let text = Deno.readTextFileSync(filename)
    text = text.replace(packageJson.version, version)
    Deno.writeTextFileSync(filepath, text)
}

const packageJsonPath = Deno.realPathSync('./package.json')
packageJson.version = version
const encoder = new TextEncoder()
const data = encoder.encode(JSON.stringify({ ...packageJson }, null, 4) + '\n')
Deno.writeFileSync(packageJsonPath, data)
