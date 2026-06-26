import 'dotenv/config';
import simpleGit from 'simple-git';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

const {
  GITHUB_TOKEN,
  PLATFORM_REPO_OWNER,
  PLATFORM_REPO_NAME,
  PLATFORM_REPO_BRANCH = 'main',
} = process.env;

if (!GITHUB_TOKEN || !PLATFORM_REPO_OWNER || !PLATFORM_REPO_NAME) {
  console.error('❌ Missing required env variables in .env');
  process.exit(1);
}

const REPO_URL = `https://${GITHUB_TOKEN}@github.com/${PLATFORM_REPO_OWNER}/${PLATFORM_REPO_NAME}.git`;
const TEMP_DIR = path.join(os.tmpdir(), `platform-repo-${Date.now()}`);
const DEST_BLOCKS_DIR = path.resolve('blocks');
const DEST_SCRIPTS_DIR = path.resolve('scripts');

async function syncBlocks() {
  try {
    console.log('⏳ Cloning platform repo...');
    await simpleGit().clone(REPO_URL, TEMP_DIR, ['--depth', '1', '--branch', PLATFORM_REPO_BRANCH]);

    const sourceBlocksDir = path.join(TEMP_DIR, 'blocks');
    const sourceScriptsDir = path.join(TEMP_DIR, 'scripts');
    const sourceComponentFilters = path.join(TEMP_DIR, 'component-filters.json');
    const sourceComponentDefinition = path.join(TEMP_DIR, 'component-definition.json');
    const sourceComponentModels = path.join(TEMP_DIR, 'component-models.json');


    if (!fs.existsSync(sourceBlocksDir)) {
      console.error('❌ No blocks folder found in platform repo');
      process.exit(1);
    }

    console.log('📁 Copying blocks folder...');
    await fs.copy(sourceBlocksDir, DEST_BLOCKS_DIR, { overwrite: true });

    console.log('📁 Copying scripts folder...');
    await fs.copy(sourceScriptsDir, DEST_SCRIPTS_DIR, { overwrite: true });

    console.log('📄 Copying component-filters.json...');
    if (fs.existsSync(sourceComponentFilters)) {
      await fs.copy(sourceComponentFilters, path.resolve('component-filters.json'), { overwrite: true });
    }

    console.log('📄 Copying component-definition.json...');
    if (fs.existsSync(sourceComponentDefinition)) {
      await fs.copy(sourceComponentDefinition, path.resolve('component-definition.json'), { overwrite: true });
    }

    console.log('📄 Copying component-models.json...');
    if (fs.existsSync(sourceComponentModels)) {
      await fs.copy(sourceComponentModels, path.resolve('component-models.json'), { overwrite: true });
    }
    
    console.log('🧹 Cleaning up temp files...');
    await fs.remove(TEMP_DIR);

    console.log('✅ Blocks and scripts synced successfully!');
  } catch (err) {
    console.error('❌ Sync failed:', err.message);
    await fs.remove(TEMP_DIR).catch(() => {});
    process.exit(1);
  }
}

syncBlocks();