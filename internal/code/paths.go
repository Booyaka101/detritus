package code

import (
	"os"
	"path/filepath"
)

// DataDir returns the detritus data directory.
// Resolution order: $DETRITUS_HOME, $XDG_DATA_HOME/detritus, ~/.detritus.
func DataDir() string {
	if p := os.Getenv("DETRITUS_HOME"); p != "" {
		return p
	}
	if xdg := os.Getenv("XDG_DATA_HOME"); xdg != "" {
		return filepath.Join(xdg, "detritus")
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return ".detritus"
	}
	return filepath.Join(home, ".detritus")
}

// PacksDir returns the directory under which all packs live.
func PacksDir() string {
	return filepath.Join(DataDir(), "packs")
}

// PackDir returns the directory for a single named pack.
func PackDir(name string) string {
	return filepath.Join(PacksDir(), name)
}

// ManifestPath returns the path of a pack's manifest.json.
func ManifestPath(name string) string {
	return filepath.Join(PackDir(name), "manifest.json")
}

// IndexPath returns the directory of a pack's Bleve index.
func IndexPath(name string) string {
	return filepath.Join(PackDir(name), "index.bleve")
}

// EnsurePacksDir creates the packs parent dir if it doesn't exist.
func EnsurePacksDir() error {
	return os.MkdirAll(PacksDir(), 0o755)
}
