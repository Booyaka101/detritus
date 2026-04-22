package main

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/benitogf/detritus/internal/code"
)

// runPack handles `detritus --pack [name] [root...]`.
//
//	detritus --pack                       → pack CWD as pack named <basename>
//	detritus --pack <name>                → refresh <name>, or pack CWD as <name>
//	detritus --pack <name> <root>...      → create/refresh <name> with those roots
func runPack(args []string) error {
	name, roots, err := resolvePackArgs(args)
	if err != nil {
		return err
	}
	stats, err := code.Pack(name, roots, code.Options{DetritusVersion: version})
	if err != nil {
		return err
	}
	fmt.Printf("Pack %q — %d files, ~%d tokens (%dB) — new:%d modified:%d deleted:%d unchanged:%d — %s\n",
		name, stats.Files, stats.Tokens, stats.Bytes, stats.New, stats.Modified, stats.Deleted, stats.Unchanged,
		stats.Duration.Round(1e6))
	return nil
}

func resolvePackArgs(args []string) (string, []string, error) {
	cwd, err := os.Getwd()
	if err != nil {
		return "", nil, err
	}
	switch len(args) {
	case 0:
		return filepath.Base(cwd), []string{cwd}, nil
	case 1:
		name := args[0]
		if _, err := code.LoadManifest(name); err == nil {
			return name, nil, nil
		}
		return name, []string{cwd}, nil
	default:
		return args[0], args[1:], nil
	}
}

// runRefresh handles `detritus --refresh <name>`.
func runRefresh(args []string) error {
	if len(args) < 1 {
		return fmt.Errorf("usage: detritus --refresh <name>")
	}
	name := args[0]
	stats, err := code.Pack(name, nil, code.Options{DetritusVersion: version})
	if err != nil {
		return err
	}
	fmt.Printf("Refreshed %q — %d files, ~%d tokens (%dB) — new:%d modified:%d deleted:%d unchanged:%d — %s\n",
		name, stats.Files, stats.Tokens, stats.Bytes, stats.New, stats.Modified, stats.Deleted, stats.Unchanged,
		stats.Duration.Round(1e6))
	return nil
}

// runUnpack handles `detritus --unpack <name>`.
func runUnpack(args []string) error {
	if len(args) < 1 {
		return fmt.Errorf("usage: detritus --unpack <name>")
	}
	name := args[0]
	if err := code.Unpack(name); err != nil {
		return err
	}
	fmt.Printf("Removed pack %q\n", name)
	return nil
}

// runPacks handles `detritus --packs`.
func runPacks() error {
	manifests, err := code.ListManifests()
	if err != nil {
		return err
	}
	if len(manifests) == 0 {
		fmt.Println("No packs. Run `detritus --pack` to create one.")
		return nil
	}
	for _, m := range manifests {
		fmt.Printf("%s\t%d files\t~%d tokens\t%s\n",
			m.Name, m.FileCount, m.TotalTokens, m.PackedAt.Format("2006-01-02 15:04"))
		for _, r := range m.Roots {
			fmt.Printf("    %s\n", r)
		}
	}
	return nil
}
