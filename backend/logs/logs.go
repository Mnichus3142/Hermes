package logs

import (
	"log/slog"
	"os"
	"github.com/lmittmann/tint"
)

// ========================================================================================
// Prepare function to set up the logger with tint handler and set it as the default logger
// ========================================================================================

func Prepare() {
	handler := tint.NewHandler(os.Stdout, nil)

	logger := slog.New(handler)
	slog.SetDefault(logger)
}
