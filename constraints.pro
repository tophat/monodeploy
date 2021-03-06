constraints_min_version(1).

% This rule enforces that all workspaces must depend on other workspaces using `workspace:*` in devDependencies
gen_enforced_dependency(WorkspaceCwd, DependencyIdent, 'workspace:*', 'devDependencies') :-
  workspace_has_dependency(WorkspaceCwd, DependencyIdent, _, 'devDependencies'),
  % Only consider those that target something that could be a workspace
  workspace_ident(DependencyCwd, DependencyIdent).

% Monodeploy (cli) should satisfy all dependency's peers
gen_enforced_dependency(WorkspaceCwd, DependencyIdent, PrefixedDependencyRange, 'dependencies') :-
  % Only target the CLI & plugin (independent packages)
  (
      workspace_field(WorkspaceCwd, 'name', 'monodeploy');
      workspace_field(WorkspaceCwd, 'name', '@monodeploy/node');
      workspace_field(WorkspaceCwd, 'name', '@monodeploy/plugin-github')
  ),
  % Iterates over all dependencies from all workspaces
  workspace_has_dependency(WorkspaceCwd, PackageDependency, _, 'dependencies'),
  % Filter out external packages (PackageDependency must be a yarn workspace in this package)
  workspace_ident(DependencyCwd, PackageDependency),
  % Get all peer dependencies from DependencyCwd
  workspace_has_dependency(DependencyCwd, DependencyIdent, DependencyRange, 'peerDependencies'),
  % DependencyRange should use workspace protocol
  (
      workspace_ident(_, DependencyIdent) ->
        atom_concat('workspace:', DependencyRange, PrefixedDependencyRange);
      \+workspace_ident(_, DependencyIdent) ->
        PrefixedDependencyRange = DependencyRange
  ),
  % Check WorkspaceCwd doesn't already provide DependencyIdent directly
  \+ workspace_has_dependency(WorkspaceCwd, DependencyIdent, _, 'peerDependencies').

% @yarnpkg/* should be peer and dev dependencies for all workspaces except for some exceptions
gen_enforced_dependency(WorkspaceCwd, YarnDependencyIdent, YarnRange, TargetDependencyType) :-
    % ignore private workspaces
    \+ workspace_field(WorkspaceCwd, 'private', 'true'),
    % only if it's currently a dependency
    workspace_has_dependency(WorkspaceCwd, YarnDependencyIdent, YarnRange, DependencyType),
    (
        DependencyType = 'dependencies';
        DependencyType = 'peerDependencies'
    ),
    (
        TargetDependencyType = 'peerDependencies';
        TargetDependencyType = 'devDependencies'
    ),
    % only for yarnpkg scope
    atom_concat('@yarnpkg/', _, YarnDependencyIdent),
    \+ (
      workspace_field(WorkspaceCwd, 'name', 'monodeploy');
      workspace_field(WorkspaceCwd, 'name', '@monodeploy/node');
      workspace_field(WorkspaceCwd, 'name', '@monodeploy/plugin-github')
    ).

% @yarnpkg/* should NOT be in dependencies
gen_enforced_dependency(WorkspaceCwd, YarnDependencyIdent, null, 'dependencies') :-
    % ignore private workspaces
    \+ workspace_field(WorkspaceCwd, 'private', 'true'),
    % only if it's currently a dependency
    workspace_has_dependency(WorkspaceCwd, YarnDependencyIdent, _, 'peerDependencies'),
    % only for yarnpkg scope
    atom_concat('@yarnpkg/', _, YarnDependencyIdent),
    \+ (
      workspace_field(WorkspaceCwd, 'name', 'monodeploy');
      workspace_field(WorkspaceCwd, 'name', '@monodeploy/node')
    ).
