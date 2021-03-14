module.exports = {
    excludeFiles: ["**/lib/**"],
    excludePackages: pkg => ["@tophat/eslint-config"].includes(pkg) || pkg.startsWith("@types/"),
}
