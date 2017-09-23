interface IArtifacts {
  require: (path: string) => any;
}

declare var artifacts: IArtifacts;
