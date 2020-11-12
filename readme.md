## 실행법

```

pm2 start npm --name "music_box" -- start 


cd www
mkdir uploads
pm2 start http-server --name "web" -- -p 17371


```

## souns system setup

모듈설치
```
sudo apt-get install alsa-utils
```

플레이어 설치
```
sudo apt-get install mpg321
```

싸운드 드라이버 설치확인
```
sudo modprobe snd-bcm2835
sudo lsmod | grep 2835
```

출력설정 0 :자동,1:아날로그,2:hdmi
```
sudo amixer cset numid=3 n
```

(0~400 , 0%~100%)
```
sudo amixer cset numid=1 n
```

스피커 테스트
```
speaker-test -t sine -f 440 -c 2 -s 1
```
