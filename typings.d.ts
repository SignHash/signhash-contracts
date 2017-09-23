interface Artifacts {
  require: (path: string) => any;
}

declare var artifacts: Artifacts;
