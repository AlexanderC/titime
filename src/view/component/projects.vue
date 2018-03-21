<template>
  <md-empty-state v-if="projects.length <= 0"
    md-icon="devices_other"
    md-label="Start tracking your time"
    md-description="Adding a project you'll be able to track the time you are spending on it.">
    <md-button @click="addSampleProject()" class="md-primary md-raised">Add first project</md-button>
  </md-empty-state>
  <div v-else>
    <md-list>
      <md-list-item :class="{ 'archived-project': project.isArchived }" @mouseover="showProjectMenu(project)" @mouseout="hideProjectMenu()" @click="clickProject(project)" v-for="project in sortedProjects" v-bind:key="project._id">
        <md-icon v-if="project.isArchived">archive</md-icon>
        <md-icon v-else-if="isActiveProject(project)">check_circle</md-icon>
        <md-icon v-else>radio_button_unchecked</md-icon>

        <span class="md-list-item-text">
          {{ project.name }}
          <md-tooltip md-direction="top">{{ project.name }}</md-tooltip>
        </span>

        <div class="list-item-menu" v-if="hasActiveProjectMenu(project)" :md-active="true">
          <md-button @click.stop.prevent="reportProject(project)" class="md-list-action md-icon-button md-accent">
            <md-icon>insert_chart</md-icon>
            <md-tooltip md-direction="top">View Report</md-tooltip>
          </md-button>
          <md-button v-if="project.link" @click.stop.prevent="openLink(project.link)" class="md-list-action md-icon-button">
            <md-icon>launch</md-icon>
            <md-tooltip md-direction="top">Open Link</md-tooltip>
          </md-button>
          <md-button @click.stop.prevent="project.isArchived ? unarchiveProject(project) : archiveProject(project)" :disabled="tracking" class="md-list-action md-icon-button">
            <md-icon>{{ project.isArchived ? 'unarchive' : 'archive' }}</md-icon>
            <md-tooltip md-direction="top">{{ project.isArchived ? 'Unarchive' : 'Archive' }} Project</md-tooltip>
          </md-button>
          <md-button @click.stop.prevent="askForRemoval(project)" :disabled="tracking" class="md-icon-button md-primary">
            <md-icon>delete</md-icon>
            <md-tooltip md-direction="top">Delete Project</md-tooltip>
          </md-button>
        </div>
      </md-list-item>

      <md-list-item>
        <md-button @click.prevent.stop="newProjectDialog = true" class="md-accent">
          <md-icon>create</md-icon>
          Add Project
        </md-button>
        <md-button @click.prevent.stop="redmineDialog = true">
          <md-icon>bug_report</md-icon>
          Redmine
        </md-button>
        <md-button @click.prevent.stop="jiraDialog = true">
          <md-icon>bug_report</md-icon>
          Jira
        </md-button>
      </md-list-item>
    </md-list>

    <md-dialog v-if="redmineDialog" md-active>
    <md-dialog-title>Redmine Integration</md-dialog-title>

    <md-content class="new-project">
      <md-field>
        <label>Host</label>
        <md-input v-model="redmineHost" required></md-input>
      </md-field>

      <md-field>
        <label>Api Key</label>
        <md-input v-model="redmineApiKey" type="password"></md-input>
      </md-field>
    </md-content>

    <md-dialog-actions>
      <md-button class="md-raised" @click="redmineDialog = false">Close</md-button>
      <md-button class="md-raised md-accent" :disabled="!canSyncRedmine()" @click="syncRedmine(); redmineDialog = false">Synchronize</md-button>
    </md-dialog-actions>
  </md-dialog>

    <md-dialog v-if="jiraDialog" md-active>
      <md-dialog-title>Jira Integration</md-dialog-title>

      <md-content class="new-project">
        <md-field>
          <label>Host</label>
          <md-input v-model="jiraHost" required></md-input>
        </md-field>

        <md-field>
          <label>Username</label>
          <md-input v-model="jiraUsername" required></md-input>
        </md-field>

        <md-field>
          <label>Password</label>
          <md-input v-model="jiraPassword" type="password"></md-input>
        </md-field>
      </md-content>

      <md-dialog-actions>
        <md-button class="md-raised" @click="jiraDialog = false">Close</md-button>
        <md-button class="md-raised md-accent" :disabled="!canSyncJira()" @click="syncJira(); jiraDialog = false">Synchronize</md-button>
      </md-dialog-actions>
    </md-dialog>

  <md-dialog v-if="newProjectDialog" md-active>
    <md-dialog-title>Add a Project</md-dialog-title>

    <md-content class="new-project">
      <md-field>
        <label>Name</label>
        <md-input v-model="newProjectName" required></md-input>
      </md-field>

      <md-field>
        <label>Link</label>
        <md-input v-model="newProjectLink"></md-input>
      </md-field>
    </md-content>

    <md-dialog-actions>
      <md-button class="md-raised" @click="newProjectDialog = false">Close</md-button>
      <md-button class="md-raised md-accent" :disabled="!allowSaveNewItem()" @click="saveNewProject(); newProjectDialog = false">Save</md-button>
    </md-dialog-actions>
  </md-dialog>

  <md-dialog-confirm
    v-if="projectToRemove"
    md-active
    md-title="Are you sure you want to remove the project?"
    :md-content="'If you click <b>Remove</b> the project <i>' + projectToRemove.name + '</i> and <b>ALL</b> the data will be removed <b>forever</b>!'"
    md-confirm-text="Remove"
    md-cancel-text="Cancel"
    @md-cancel="cancelRemoval"
    @md-confirm="approveRemoval" />
  </div>
</template>

<script>
import { shell } from 'electron';
import validUrl from 'valid-url';

const PROJECT_SELECTED = 'property-selected';
const REDMINE = { HOST: 'redmine_host', API_KEY: 'redmine_apiKey' };
const JIRA = { HOST: 'jira_host', USERNAME: 'jira_username', PASSWORD: 'jira_password' };

export default {
  PROJECT_SELECTED,
  name: 'projects',
  props: ['tracking'],
  data () {
    return {
      redmineDialog: false,
      redmineHost: null,
      redmineApiKey: null,
      jiraDialog: false,
      jiraHost: null,
      jiraUsername: null,
      jiraPassword: null,
      newProjectDialog: false,
      newProjectName: null,
      newProjectLink: null,
      add: false,
      activeProject: null,
      projects: [],
      projectToRemove: null,
      activeProjectMenu: null,
    };
  },
  watch: {
    activeProject (val) {
      this._syncActiveProject();
    },
  },
  computed: {
    $registry () {
      return this.$electron.remote.getGlobal('$registry');
    },
    sortedProjects () {
      return this.projects.sort()
        .sort((a, b) => (a.isArchived && b.isArchived ? 0 : a.isArchived ? 1 : b.isArchived ? -1 : 0));
    },
  },
  created () {
    this.refresh();

    this.syncRedmine(true);
    this.syncJira(true);
  },
  methods: {
    canSyncRedmine () {
      return this.redmineHost && this.redmineApiKey;
    },
    canSyncJira () {
      return this.jiraHost && this.jiraUsername && this.jiraPassword;
    },
    async syncRedmine (readConfig = false) {
      if (readConfig) {
        this.redmineHost = this.$registry.config().get(REDMINE.HOST);
        this.redmineApiKey = this.$registry.config().get(REDMINE.API_KEY);
      }

      if (this.canSyncRedmine()) {
        this.$registry.get('logger').info(`Trigger Redmine synchronization`);

        this.$registry.config().set(REDMINE.HOST, this.redmineHost);
        this.$registry.config().set(REDMINE.API_KEY, this.redmineApiKey);

        try {
          await this.$registry.get('synchronizeRedmine')(this.redmineHost, this.redmineApiKey);
          this.refresh();

          this.$registry.get('notify')(
            'TiTime',
            `We've successfully synchronized w/ Redmine (${ this.redmineHost }).`
          );
        } catch (error) {
          this.$registry.get('logger').error(error.message);

          this.$registry.get('notify')(
            'TiTime',
            `Failed to synchronized w/ Redmine (${ this.redmineHost }). Error: ${ error.message }`
          );
        }
      }
    },
    async syncJira (readConfig = false) {
      if (readConfig) {
        this.jiraHost = this.$registry.config().get(JIRA.HOST);
        this.jiraUsername = this.$registry.config().get(JIRA.USERNAME);
        this.jiraPassword = this.$registry.config().get(JIRA.PASSWORD);
      }

      if (this.canSyncJira()) {
        this.$registry.get('logger').info('Trigger Jira synchronization');

        this.$registry.config().set(this.jiraHost, JIRA.HOST);
        this.$registry.config().set(this.jiraUsername, JIRA.USERNAME);
        this.$registry.config().set(this.jiraPassword, JIRA.PASSWORD);

        try {
          await this.$registry.get('synchronizeJira')(this.jiraHost, this.jiraUsername, this.jiraPassword);
          this.refresh();

          this.$registry.get('notify')(
            'TiTime',
            `We've successfully synchronized w/ Jira (${ this.jiraHost }).`
          );
        } catch (error) {
          this.$registry.get('logger').error(error.message);

          this.$registry.get('notify')(
            'TiTime.',
            `Failed to synchronized w/ Jira (${ this.jiraHost }). Error: ${ error.message }`
          );
        }
      }
    },
    validUrl (val) {
      return validUrl.isUri(val);
    },
    _syncActiveProject() {
      this.$registry.get('events').emit(
        PROJECT_SELECTED, 
        this.activeProject || false
      );
    },
    refresh () {
      this.projects = this.$registry.get('db').find();
      this._syncActiveProject();
    },
    clickProject (project) {
      if (this.tracking || project.isArchived) {
        return;
      }
      
      if (this.isActiveProject(project)) {
        this.activeProject = null;
      } else {
        this.activeProject = project;
      }
    },
    showProjectMenu (project) {
      this.activeProjectMenu = project;
    },
    hideProjectMenu () {
      this.activeProjectMenu = null;
    },
    hasActiveProjectMenu (project) {
      return this.activeProjectMenu && project._id === this.activeProjectMenu._id;
    },
    isActiveProject (project) {
      return this.activeProject && project._id === this.activeProject._id;
    },
    openLink (link) {
      return shell.openExternal(link);
    },
    addSampleProject() {
      this.$registry.config().get('sampleProjects', [])
        .forEach(project => this.saveProject(project));
    },
    archiveProject (project) {
      this.$registry.get('logger').info(`Archive "${project.name}" project`);

      if (this.isActiveProject(project)) {
        this.activeProject = null;
      }

      const { _id } = project;
      
      this.$registry.get('db').update({ _id }, { isArchived: true });

      this.refresh();
    },
    unarchiveProject (project) {
      this.$registry.get('logger').info(`Unarchive "${project.name}" project`);

      const { _id } = project;
      
      this.$registry.get('db').update({ _id }, { isArchived: false });

      this.refresh();
    },
    allowSaveNewItem() {
      return this.newProjectName && this.newProjectName.length > 0
        && (
          !this.newProjectLink || this.newProjectLink.length <= 0 
          || (this.newProjectLink.length > 0 && this.validUrl(this.newProjectLink))
        );
    },
    saveNewProject () {
      this.saveProject({
        name: this.newProjectName,
        link: this.newProjectLink,
      });

      this.newProjectName = null;
      this.newProjectLink = null;
    },
    saveProject (project) {
      this.$registry.get('logger').info(`Save "${project.name}" project`);

      this.$registry.get('db').save(project);

      this.refresh();
    },
    askForRemoval (project) {
      this.projectToRemove = project;
    },
    cancelRemoval () {
      this.projectToRemove = null;
    },
    approveRemoval () {
      if (this.projectToRemove) {
        this.deleteProject(this.projectToRemove);

        this.projectToRemove = null;
      }
    },
    deleteProject (project) {
      this.$registry.get('logger').info(`Delete "${project.name}" project`);

      const { _id } = project;

      this.$registry.get('db').remove({ _id }, true);

      this.refresh();
    },
    reportProject (project) {
      this.$registry.get('logger').debug(`Open report for "${project.name}" project`);

      this.$registry.get('openReport')(project._id);
    },
  },
};
</script>
