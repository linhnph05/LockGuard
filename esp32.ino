#include <Keypad.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <ESP32Servo.h>
#include <WiFi.h>
#include <PubSubClient.h>

// WiFi credentials
const char* ssid = "Home_Thong_Linh 5";
const char* password = "30301078";

// MQTT broker
const char* mqtt_server = "broker.hivemq.com";  // hoặc "test.mosquitto.org"
const int mqtt_port = 1883;

WiFiClient espClient;
PubSubClient client(espClient);


#define BUTTON_PIN 4
#define BUZZER_PIN 19
#define LED_RED 18
#define LED_GREEN 5
#define PIR_PIN    21

// LCD I2C (địa chỉ 0x27, LCD 20x4)
LiquidCrystal_I2C lcd(0x27, 20, 4);

// Keypad 3x4
const byte ROWS = 4;
const byte COLS = 3;
char keys[ROWS][COLS] = {
  {'1','2','3'},
  {'4','5','6'},
  {'7','8','9'},
  {'*','0','#'}
};
// Chân ESP32 nối keypad
byte rowPins[ROWS] = {14, 32, 33, 26};  //27 12 25 14 32 33 26
byte colPins[COLS] = {27 ,12 ,25};   
Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);
// Biến theo dõi vị trí con trỏ
int cursor_col = 0;
int cursor_row = 1;

Servo myServo;
const int servoPin = 2;  // GPIO2 = D2



String correctPassword = "147";
String inputPassword = "";

int maxAttempts = 3;
int remainingAttempts = 3;

bool allow_input = false;
unsigned long input_start_time = 0;   // thời điểm bắt đầu cho nhập
unsigned long input_duration = 300000; // thời gian cho phép nhập (30 giây)

bool block = false;
bool isPIR = true;
bool result;
bool send = true;
bool read_pir = true;
unsigned long  pir_time_read = 0;

String led = "";
String buzzer = "";
String servo = "";
int receive = 0;

int each_time_PIR = 10000;

void reconnect() {
  while (!client.connected()) {
    Serial.print("Đang kết nối MQTT...");
    if (client.connect("lockguard1/esp32_client")) {
      Serial.println("✓ Đã kết nối");

      // Đăng ký (subscribe) các topic
      client.subscribe("lockguard1/esp32/led");
      client.subscribe("lockguard1/esp32/buzzer");
      client.subscribe("lockguard1/esp32/servo");

    } else {
      Serial.print("Lỗi, thử lại sau 5s. Lỗi: ");
      Serial.println(client.state());
      delay(5000);
    }
  }
}



void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}




void alarmBuzzer() {
  // Phát âm thanh cảnh báo 3 lần
  for (int i = 0; i <= 3; i++) {
    tone(BUZZER_PIN, 1000); // Tần số 1000Hz
    delay(700);
    noTone(BUZZER_PIN);
    delay(400);
  }
}



void print_Result()
{
  if (led == "green") {
    digitalWrite(LED_GREEN, HIGH);
    digitalWrite(LED_RED, LOW);
  }
  else if (led == "red") {
    digitalWrite(LED_RED, HIGH);
    digitalWrite(LED_GREEN, LOW);
  }

  if (buzzer == "buzzer_success") {
    tone(BUZZER_PIN, 1000, 300);
  }
  else if (buzzer == "buzzer_fail") {
    tone(BUZZER_PIN, 500, 500);
  }
  delay(500);

  if (servo == "open") {
    myServo.write(170);
    delay(50);
  }

  if (led == "green" && buzzer == "buzzer_success" && servo == "open") {
    Serial.println("Đúng");
    result = true;
    
    lcd.setCursor(0, 3);
    lcd.print("Dung !");
    remainingAttempts = maxAttempts;
    block = true;
    delay(1000);

    lcd.clear();
    lcd.setCursor(0, 3);
    lcd.print("Nhan de khoa !");
    
  }
  else {
    Serial.println("Sai");
    result = false;

    remainingAttempts--;
    lcd.setCursor(0, 3); 
    lcd.print("Sai!");    
    delay(1000);
    
  }

  inputPassword = ""; // reset nhập lại

  lcd.setCursor(0, 2);
  lcd.print("                    ");

  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_RED, LOW);

  // nếu hết lượt thì khóa
  if (remainingAttempts <= 0) {
    client.publish("lockguard1/esp32/notify", "1");
    lcd.setCursor(0, 3);
    lcd.print("Khoa 5 phut !");
    lcd.setCursor(0, 2);
    lcd.print("                    ");
    lcd.setCursor(0, 1);
    lcd.print("                    ");
    lcd.setCursor(0, 0);
    lcd.print("                    ");

    alarmBuzzer();

    lcd.noDisplay(); 
    lcd.noBacklight();     
    // while (1); // dừng chương trình
    delay(3000);

    inputPassword = "";
    remainingAttempts = maxAttempts;

    lcd.display();
    lcd.backlight();      
    lcd.setCursor(0, 3);
    lcd.print("Hay nhap lai !");

  }


 led = "";
 buzzer = "";
 servo = "";
 receive = 0;
}

void callback(char* topic, byte* payload, unsigned int length) {
  String msg = "";
  for (unsigned int i = 0; i < length; i++) {
    msg += (char)payload[i];
  }

  // Hiển thị rõ ràng log MQTT
  Serial.print("[MQTT] Nhận từ topic: ");
  Serial.print(topic);
  Serial.print(" | Nội dung: ");
  Serial.println(msg);
  if(receive < 4)
  {
      receive++;
  }
  // Xử lý từng topic
  if (String(topic) == "lockguard1/esp32/led") {
    if (msg == "green") {
      led = "green";
    } else if (msg == "red") {
      led = "red";
    }
  }

  else if (String(topic) == "lockguard1/esp32/buzzer") {
    if (msg == "buzzer_success") {
      buzzer = msg;
    } else if (msg == "buzzer_fail") {
            buzzer = msg;

    }
    delay(500);
  }

  else if (String(topic) == "lockguard1/esp32/servo") {
    if (msg == "open") {
      servo = msg;
    }
    else
    {
      servo = "stop";
    }
  }
}


void setup() {
  Serial.begin(9600);
  
  pinMode(BUTTON_PIN, INPUT);  // Button D4
  pinMode(BUZZER_PIN, OUTPUT);        // Buzzer D19
  pinMode(LED_RED, OUTPUT);           // LED đỏ D18
  pinMode(LED_GREEN, OUTPUT);     
  pinMode(PIR_PIN, INPUT);
  
  


  keypad.setDebounceTime(50);  // 50ms chống rung phím

  Wire.begin(23, 22);         // SDA = 23, SCL = 22
  lcd.init();
  
  lcd.backlight();            // Bật đèn nền LCD


  myServo.attach(servoPin);
  myServo.write(0);  // Góc ban đầu

  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);

}

bool print = false;


void loop() {

  if (!client.connected()) reconnect();
    client.loop();

  if (print && led != "" && buzzer != "")
  {
    print_Result();
    send = true;
    print = false;
  }

  if (digitalRead(BUTTON_PIN) == HIGH && block) {
    myServo.write(0);  // quay về vị trí ban đầu

    Serial.println("Dong cua!");

    delay(100);  // tránh rung
    allow_input = false;
          
    remainingAttempts = maxAttempts;
    block = false;
    lcd.clear();
    lcd.noDisplay(); 
    lcd.noBacklight();

    delay(2000);
  }

  if(!block)
  {
    if(millis() - pir_time_read > 2000)
    {
        if (digitalRead(PIR_PIN) == HIGH)
        {
            read_pir = true;
            pir_time_read = millis();
        }
        else
        {
          read_pir = false;
        }
    }
    // isPIR is a flag: true means "PIR detection allowed right now".
    if(isPIR)
    {

      if (read_pir && millis() - pir_time_read < 2000) 
      {
        read_pir = false;
        Serial.println("Chuyen dong duoc phat hien!");
      allow_input = true;
      isPIR  =false;
      input_start_time = millis(); // Ghi lại thời điểm bắt đầu
      client.publish("lockguard1/esp32/pir", "1");
              
      lcd.display(); 
      lcd.backlight();
      }
      else
      {
        isPIR  =false;
        input_start_time = millis();
        client.publish("lockguard1/esp32/pir", "0");
      }
    }
    
    if(millis() - input_start_time > each_time_PIR)
    {
      isPIR = true;
    }

    if(allow_input)
    {
        lcd.setCursor(0, 1);
        lcd.print("Nhap mat khau:");
        lcd.setCursor(0, 0);
        lcd.print("So lan con lai: ");
        lcd.print(remainingAttempts);
        
    // Nếu đang cho phép nhập nhưng đã hết thời gian
      if (allow_input && millis() - input_start_time > input_duration) {
        allow_input = false;
        isPIR = true;
        lcd.clear();
        inputPassword = "";
        remainingAttempts = maxAttempts;
        lcd.noDisplay(); 
        lcd.noBacklight(); 
      }

      char key = keypad.getKey();

      if (key) {
        Serial.println(key);


        if (key == '*') {
          inputPassword = "";
          lcd.setCursor(0, 2);
          lcd.print("                    ");
        } else {
          if (inputPassword.length() < 20) {
            inputPassword += key;
            lcd.setCursor(0, 2);
            lcd.print(inputPassword);
          }
        }
      }
      
      if (digitalRead(BUTTON_PIN) == HIGH && !block && send) {
        Serial.println("You successfull enter the password");
        while(digitalRead(BUTTON_PIN) == HIGH);
        print = true;
        lcd.setCursor(0, 3);
        lcd.print("                    ");
        result = false;

        led = "";
        buzzer = "";
        servo = "";
        receive = 0;

        client.publish("lockguard1/esp32/password", inputPassword.c_str());  
        delay(700);
        send = false;
      }


    }
  }
}
