<?php
/**
 * Importes grandes (dump de producción) sin tope práctico de tiempo/memoria.
 * Los .sql/.sql.gz de ./docker/phpmyadmin/uploads aparecen en Importar → directorio.
 */
$cfg['ExecTimeLimit'] = 0;
$cfg['MemoryLimit'] = '0';
$cfg['UploadDir'] = '/var/www/upload';
$cfg['SaveDir'] = '';
$cfg['LoginCookieValidity'] = 28800;
$cfg['VersionCheck'] = false;
$cfg['MaxRows'] = 50;
$cfg['ForeignKeyChecks'] = '0';
