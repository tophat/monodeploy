constraints_min_version(1).

% This rule enforces that all workspaces must depend on other workspaces using `workspace:*` in devDependencies
gen_enforced_dependency(WorkspaceCwd, DependencyIdent, 'workspace:*', 'devDependencies') :-
  workspace_has_dependency(WorkspaceCwd, DependencyIdent, _, 'devDependencies'),
  % Only consider those that target something that could be a workspace
  workspace_ident(DependencyCwd, DependencyIdent).

% Monodeploy (cli) should satisfy all dependency's peers
gen_enforced_dependency(WorkspaceCwd, DependencyIdent, PrefixedDependencyRange, 'dependencies') :-
  % Only target the CLI
  (
      workspace_field(WorkspaceCwd, 'name', 'monodeploy');
      workspace_field(WorkspaceCwd, 'name', '@monodeploy/node')
  ),
  % Iterates over all dependencies from all workspaces
  workspace_has_dependency(WorkspaceCwd, PackageDependency, _, 'dependencies'),
  % Filter out external packages (PackageDependency must be a yarn workspace in this package)
  workspace_ident(DependencyCwd, PackageDependency),
  % Get all peer dependencies from DependencyCwd
  workspace_has_dependency(DependencyCwd, DependencyIdent, DependencyRange, 'peerDependencies'),
  % DependencyRange should use workspace protocol
  atom_concat('workspace:', DependencyRange, PrefixedDependencyRange),
  % Check WorkspaceCwd doesn't already provide DependencyIdent directly
  \+ workspace_has_dependency(WorkspaceCwd, DependencyIdent, _, 'peerDependencies').
