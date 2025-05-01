package main

import (
	"testing"
	"github.com/stretchr/testify/assert"
)

func TestGetEnv_Default(t *testing.T) {
	val := getEnv("NON_EXISTENT_KEY", "default")
	assert.Equal(t, "default", val)
}

// Adicione outros testes unitários aqui conforme necessário
