const core = require('@actions/core');
const github = require('@actions/github');
const yaml = require('js-yaml');
const fs = require('fs');
const { minimatch } = require('minimatch');

async function run() {
  try {
    const token = core.getInput('token');
    const configPath = core.getInput('config');
    const octokit = github.getOctokit(token);
    const context = github.context;

    if (!context.payload.pull_request) {
      core.info('Not a pull request event. Skipping.');
      return;
    }

    const prNumber = context.payload.pull_request.number;
    const owner = context.repo.owner;
    const repo = context.repo.repo;

    // Load config
    let config;
    try {
      const configContent = fs.readFileSync(configPath, 'utf8');
      config = yaml.load(configContent);
    } catch (err) {
      core.setFailed(`Could not read config file at ${configPath}: ${err.message}`);
      return;
    }

    // Get changed files
    const { data: files } = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber,
    });

    const changedFiles = files.map(f => f.filename);
    core.info(`Changed files: ${changedFiles.join(', ')}`);

    // Match labels
    const labelsToAdd = new Set();

    for (const [label, patterns] of Object.entries(config)) {
      const globs = Array.isArray(patterns) ? patterns : [patterns];
      for (const file of changedFiles) {
        for (const pattern of globs) {
          if (minimatch(file, pattern)) {
            labelsToAdd.add(label);
            break;
          }
        }
      }
    }

    if (labelsToAdd.size === 0) {
      core.info('No matching labels found.');
      return;
    }

    const labels = [...labelsToAdd];
    core.info(`Adding labels: ${labels.join(', ')}`);

    // Ensure labels exist
    for (const label of labels) {
      try {
        await octokit.rest.issues.getLabel({ owner, repo, name: label });
      } catch {
        const colors = ['0e8a16', '1d76db', 'e4e669', 'd93f0b', 'c5def5', 'bfdadc', 'f9d0c4'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        await octokit.rest.issues.createLabel({ owner, repo, name: label, color });
        core.info(`Created label: ${label}`);
      }
    }

    // Add labels to PR
    await octokit.rest.issues.addLabels({
      owner,
      repo,
      issue_number: prNumber,
      labels,
    });

    core.info(`Successfully labeled PR #${prNumber}`);
    core.setOutput('labels', labels.join(','));
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
