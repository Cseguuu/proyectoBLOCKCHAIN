// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/RegistroDocumentos.sol";

contract DeployRegistro is Script {
    function run() external {
        vm.startBroadcast();
        RegistroDocumentos registro = new RegistroDocumentos();
        vm.stopBroadcast();

        console.log("RegistroDocumentos desplegado en:", address(registro));
    }
}
