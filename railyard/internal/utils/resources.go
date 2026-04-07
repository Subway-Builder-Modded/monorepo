package utils

import "github.com/shirou/gopsutil/v4/mem"

func GetTotalSystemMemoryMB() (uint64, error) {
	vmStat, err := mem.VirtualMemory()
	if err != nil {
		return 0, err
	}

	return vmStat.Total / (1024 * 1024), nil
}
