package logs

import (
	"log/slog"
	"os"
	"github.com/lmittmann/tint"
)

func Prepare() {
	handler := tint.NewHandler(os.Stdout, nil)

	logger := slog.New(handler)
	slog.SetDefault(logger)
}
